
// Most product data operations are currently handled directly in the page components (ProductsPage, ProductFormPage).
// This file can be used to centralize product data logic if it becomes more complex or needs to be reused across multiple components.

import { collection, addDoc, getDoc, getDocs, setDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp, Timestamp, runTransaction, increment, writeBatch, limit, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Product } from '../types';
import { FIRESTORE_COLLECTIONS } from '../constants';

/**
 * Adds a new product to Firestore.
 * @param productData The product data to add.
 * @returns The ID of the newly created product.
 */
export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, FIRESTORE_COLLECTIONS.PRODUCTS), {
      ...productData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error; // Re-throw to be handled by the caller
  }
};

/**
 * Fetches a single product by its barcode.
 * @param barcode The barcode of the product to fetch.
 * @returns The Product object or null if not found.
 */
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
  try {
    const productsRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
    const q = query(productsRef, where("barcode", "==", barcode), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data() as Omit<Product, 'id' | 'expirationDate'> & { expirationDate: Timestamp | string, createdAt: Timestamp, updatedAt: Timestamp };
      return { 
        id: docSnap.id, 
        ...data,
        expirationDate: data.expirationDate instanceof Timestamp ? data.expirationDate.toDate().toISOString().split('T')[0] : data.expirationDate,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by barcode: ", error);
    throw error;
  }
};

/**
 * Fetches a single product by its ID.
 * @param productId The ID of the product to fetch.
 * @returns The Product object or null if not found.
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const productDocRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, productId);
    const productDocSnap = await getDoc(productDocRef);
    if (productDocSnap.exists()) {
      const data = productDocSnap.data() as Omit<Product, 'id' | 'expirationDate'> & { expirationDate: Timestamp | string, createdAt: Timestamp, updatedAt: Timestamp };
      return { 
        id: productDocSnap.id, 
        ...data,
        expirationDate: data.expirationDate instanceof Timestamp ? data.expirationDate.toDate().toISOString().split('T')[0] : data.expirationDate,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
      } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product by ID: ", error);
    throw error;
  }
};

/**
 * Updates an existing product in Firestore.
 * @param productId The ID of the product to update.
 * @param productData The partial product data to update.
 */
export const updateProduct = async (productId: string, productData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) => {
  try {
    const productDocRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, productId);
    await setDoc(productDocRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error("Error updating product: ", error);
    throw error;
  }
};

/**
 * Deletes a product from Firestore.
 * @param productId The ID of the product to delete.
 */
export const deleteProductById = async (productId: string): Promise<void> => {
  try {
    const productDocRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, productId);
    await deleteDoc(productDocRef);
  } catch (error) {
    console.error("Error deleting product: ", error);
    throw error;
  }
};

/**
 * Fetches all products, optionally with sorting.
 * @param branchId Optional branch ID to filter products by.
 * @returns An array of Product objects.
 */
export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const q = query(collection(db, FIRESTORE_COLLECTIONS.PRODUCTS), orderBy('commercialName', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<Product, 'id' | 'expirationDate'> & { expirationDate: Timestamp | string, createdAt: Timestamp, updatedAt: Timestamp };
      return {
        id: docSnap.id,
        ...data,
        expirationDate: data.expirationDate instanceof Timestamp ? data.expirationDate.toDate().toISOString().split('T')[0] : data.expirationDate,
        createdAt: data.createdAt?.toDate(), // Add null check for createdAt/updatedAt
        updatedAt: data.updatedAt?.toDate(),
      } as Product;
    });
  } catch (error) {
    console.error("Error fetching all products: ", error);
    throw error;
  }
};

interface TransferItem {
  productId: string;
  quantity: number;
}

export const transferStock = async (toBranchId: string, items: TransferItem[]): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    // Step 1: Perform all reads first.
    const sourceProductDocs = await Promise.all(
      items.map(item => transaction.get(doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, item.productId)))
    );

    const branchStockRefs = await Promise.all(
        items.map(async (item) => {
            const q = query(
                collection(db, FIRESTORE_COLLECTIONS.BRANCH_STOCKS),
                where("productId", "==", item.productId),
                where("branchId", "==", toBranchId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.length > 0 ? snapshot.docs[0].ref : null;
        })
    );

    // Step 2: Perform all writes.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const sourceProductDoc = sourceProductDocs[i];
      const branchStockRef = branchStockRefs[i];

      if (!sourceProductDoc.exists()) {
        throw new Error(`Producto con ID ${item.productId} no encontrado en el almacén central.`);
      }

      const sourceProductData = sourceProductDoc.data() as Product;
      if (sourceProductData.currentStock < item.quantity) {
        throw new Error(`Stock insuficiente para ${sourceProductData.commercialName} en el almacén central.`);
      }

      // Decrease stock in the main warehouse
      transaction.update(sourceProductDoc.ref, { currentStock: increment(-item.quantity) });

      if (branchStockRef) {
        // If stock entry exists, update it
        transaction.update(branchStockRef, { currentStock: increment(item.quantity) });
      } else {
        // If stock entry doesn't exist, create it
        const newBranchStockRef = doc(collection(db, FIRESTORE_COLLECTIONS.BRANCH_STOCKS));
        transaction.set(newBranchStockRef, {
          branchId: toBranchId,
          productId: item.productId,
          currentStock: item.quantity,
          updatedAt: serverTimestamp(),
        });
      }
    }
  });
};

// Example: Get products low on stock
export const assignOrphanProductsToMainBranch = async (): Promise<number> => {
  const batch = writeBatch(db);
  
  // 1. Find the main branch
  const branchesRef = collection(db, 'branches');
  let mainBranchQuery = query(branchesRef, where("isMain", "==", true));
  let mainBranchSnapshot = await getDocs(mainBranchQuery);
  let mainBranchId: string;

  if (mainBranchSnapshot.empty) {
    // If no main branch is set, get the first branch and set it as main
    const allBranchesQuery = query(branchesRef, orderBy("createdAt"), limit(1));
    const allBranchesSnapshot = await getDocs(allBranchesQuery);
    if (allBranchesSnapshot.empty) {
      throw new Error("No branches found. Please create a branch first.");
    }
    const mainBranchDoc = allBranchesSnapshot.docs[0];
    await updateDoc(mainBranchDoc.ref, { isMain: true });
    mainBranchId = mainBranchDoc.id;
  } else {
    mainBranchId = mainBranchSnapshot.docs[0].id;
  }

  // 2. Find all products without a branchId
  const productsRef = collection(db, 'products');
  const productsQuery = query(productsRef, where("branchId", "==", null));
  const productsSnapshot = await getDocs(productsQuery);

  if (productsSnapshot.empty) {
    return 0; // No products to assign
  }

  // 3. Add each product to the batch update
  productsSnapshot.forEach(doc => {
    batch.update(doc.ref, { branchId: mainBranchId });
  });

  // 4. Commit the batch
  await batch.commit();
  return productsSnapshot.size;
};

export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    const productsRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
    // Firestore limitation: Cannot directly compare two fields like currentStock <= minStock
    // This query gets all products, then filter client-side. For large datasets, this is inefficient.
    // A better approach might be a scheduled function that flags low-stock items or denormalization.
    const allProductsSnapshot = await getDocs(query(productsRef, where('minStock', '>', 0))); // Only consider products with minStock set
    const lowStock: Product[] = [];
    allProductsSnapshot.forEach(docSnap => {
      const product = { id: docSnap.id, ...docSnap.data() } as Product;
      if (product.currentStock <= product.minStock) {
        lowStock.push(product);
      }
    });
    return lowStock;
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    throw error;
  }
};
