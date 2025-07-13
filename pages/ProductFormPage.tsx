import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Spinner from '../components/ui/Spinner';
import { Product, Branch, Category } from '../types';
import * as productService from '../services/productService';
import * as branchService from '../services/branchService';
import * as categoryService from '../services/categoryService';
import * as presentationService from '../services/presentationService'; // Import the new service
import * as concentrationService from '../services/concentrationService'; // Import the new service
import ManagePresentationsModal from '../components/products/ManagePresentationsModal';
import ManageConcentrationsModal from '../components/products/ManageConcentrationsModal';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { toPng } from 'html-to-image';
import { ROUTES } from '../constants'; // Importar ROUTES
// import { Html5QrcodeScanner } from 'html5-qrcode'; // Importar Html5QrcodeScanner
// Importación dinámica para evitar problemas de 'require is not defined'
let Html5QrcodeScanner: any;
if (typeof window !== 'undefined') {
  import('html5-qrcode/esm/index.js').then(module => {
    Html5QrcodeScanner = module.Html5QrcodeScanner;
  }).catch(error => {
    console.error("Error loading html5-qrcode dynamically:", error);
  });
}

interface Option {
  value: string;
  label: string;
}

const ProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product>({
    id: '',
    commercialName: '',
    genericName: '',
    costPrice: 0,
    concentration: '', // Added concentration
    presentation: '', // Added presentation
    laboratory: '', // Added laboratory
    sellingPrice: 0,
    currentStock: 0,
    minStock: 0,
    category: '',
    supplier: '',
    barcode: '',
    branchId: '',
    imageUrl: '',
    expirationDate: '',
    unit: '',
    batchNumber: '',
    location: '',
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [presentations, setPresentations] = useState<Option[]>([]); // State for presentations
  const [concentrations, setConcentrations] = useState<Option[]>([]); // State for concentrations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const html5QrcodeScannerInstanceRef = useRef<any | null>(null); // Para almacenar la instancia del escáner
  const [showPresentationsModal, setShowPresentationsModal] = useState(false);
  const [showConcentrationsModal, setShowConcentrationsModal] = useState(false);

  // Function to fetch presentations
  const fetchPresentations = async () => {
    try {
      const presentationsData = await presentationService.getPresentations();
      setPresentations(presentationsData.map(p => ({ value: p.name, label: p.name })));
    } catch (err) {
      console.error("Error fetching presentations:", err);
    }
  };

  // Function to fetch concentrations
  const fetchConcentrations = async () => {
    try {
      const concentrationsData = await concentrationService.getConcentrations();
      setConcentrations(concentrationsData.map(c => ({ value: c.name, label: c.name })));
    } catch (err) {
      console.error("Error fetching concentrations:", err);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [branchesData, categoriesData] = await Promise.all([
          branchService.getBranches(),
          categoryService.getCategories()
        ]);
        setBranches(branchesData);
        setCategories(categoriesData);

        // Fetch presentations and concentrations on mount
        await fetchPresentations();
        await fetchConcentrations();


        const mainBranch = await branchService.getMainBranch();
        let defaultBranchId = '';
        // let defaultBranchName = ''; // No se usa directamente aquí

        if (mainBranch) {
          defaultBranchId = mainBranch.id || '';
          // defaultBranchName = mainBranch.name;
        } else if (branchesData.length > 0) {
          defaultBranchId = branchesData[0].id || '';
          // defaultBranchName = branchesData[0].name;
        }

        if (id) {
          const productData = await productService.getProductById(id);
          if (productData) {
            setProduct(productData);
          } else {
            // If product not found, initialize with default branch and empty fields
            setProduct({
              id: '',
              commercialName: '',
              genericName: '',
              costPrice: 0,
              concentration: '',
              presentation: '',
              laboratory: '',
              sellingPrice: 0,
              currentStock: 0,
              minStock: 0,
              category: '',
              supplier: '',
              barcode: '',
              branchId: defaultBranchId,
              imageUrl: '',
              expirationDate: '',
              unit: '',
              batchNumber: '',
              location: '',
            });
          }
        } else {
          // If adding new product, set default branch
          setProduct((prev) => ({
            ...prev,
            branchId: defaultBranchId,
          }));
        }
      } catch (err: any) { // Especificar tipo 'any' para el error
        setError('Error al cargar datos iniciales.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Effect to refetch presentations when the modal is closed
  useEffect(() => {
    if (!showPresentationsModal) {
      fetchPresentations();
    }
  }, [showPresentationsModal]);

  // Effect to refetch concentrations when the modal is closed
  useEffect(() => {
    if (!showConcentrationsModal) {
      fetchConcentrations();
    }
  }, [showConcentrationsModal]);


  // Efecto para el escáner de teclado
  useEffect(() => {
    let barcodeBuffer = '';
    let typingTimer: NodeJS.Timeout;
    const TYPING_TIMEOUT = 100;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement instanceof HTMLInputElement && document.activeElement !== barcodeInputRef.current) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (barcodeBuffer.length > 0) {
          setProduct((prev) => ({ ...prev, barcode: barcodeBuffer }));
          searchProductByBarcode(barcodeBuffer);
          barcodeBuffer = '';
        }
        clearTimeout(typingTimer);
      } else if (e.key.length === 1) {
        barcodeBuffer += e.key;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
          if (barcodeBuffer.length > 0) {
            setProduct((prev) => ({ ...prev, barcode: barcodeBuffer }));
          }
          barcodeBuffer = '';
        }, TYPING_TIMEOUT);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(typingTimer);
    };
  }, []);

  // Efecto para el escáner de cámara
  useEffect(() => {
    if (isScannerActive) {
      // Asegurarse de que no haya una instancia previa activa
      if (!Html5QrcodeScanner) {
        console.warn("Html5QrcodeScanner not loaded yet.");
        return;
      }

      if (html5QrcodeScannerInstanceRef.current) {
        html5QrcodeScannerInstanceRef.current.clear().catch((error: any) => {
          console.error("Failed to clear existing html5QrcodeScanner. ", error);
        });
        html5QrcodeScannerInstanceRef.current = null;
      }

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      html5QrcodeScannerInstanceRef.current = html5QrcodeScanner; // Almacenar la instancia

      const onScanSuccess = (decodedText: string, decodedResult: any) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        setProduct((prev) => ({ ...prev, barcode: decodedText }));
        searchProductByBarcode(decodedText);
        setIsScannerActive(false); // Desactivar el escáner después de un escaneo exitoso
        html5QrcodeScanner.clear(); // Detener la cámara
      };

      const onScanFailure = (error: string) => {
        // console.warn(`Code scan error = ${error}`);
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);

      return () => {
        if (html5QrcodeScannerInstanceRef.current) {
          html5QrcodeScannerInstanceRef.current.clear().catch((error: any) => {
            console.error("Failed to clear html5QrcodeScanner. ", error);
          });
          html5QrcodeScannerInstanceRef.current = null;
        }
      };
    } else {
      // Si el escáner se desactiva, limpiar la instancia si existe
      if (html5QrcodeScannerInstanceRef.current) {
        html5QrcodeScannerInstanceRef.current.clear().catch((error: any) => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
        html5QrcodeScannerInstanceRef.current = null;
      }
    }
  }, [isScannerActive]);

  const searchProductByBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const foundProduct = await productService.getProductByBarcode(barcode);
      if (foundProduct) {
        setProduct(foundProduct);
        setError(null);
      } else {
        setError('Producto no encontrado con este código de barras. Puedes agregarlo como un nuevo producto.');
        setProduct((prev) => ({ ...prev, barcode: barcode }));
      }
    } catch (err: any) { // Especificar tipo 'any' para el error
      setError('Error al buscar el producto por código de barras.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { id: productId, ...productToSave } = product;
      if (id) {
        await productService.updateProduct(id, productToSave);
      } else {
        await productService.addProduct(productToSave);
      }
      navigate(ROUTES.PRODUCTS);
    } catch (err: any) { // Especificar tipo 'any' para el error
      setError('Error al guardar el producto.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateBarcode = () => {
    const newBarcode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setProduct((prev) => ({ ...prev, barcode: newBarcode }));
  };

  const downloadQRCode = async () => {
    if (qrCodeRef.current) {
      try {
        const dataUrl = await toPng(qrCodeRef.current);
        const link = document.createElement('a');
        link.download = `${product.commercialName}_barcode.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error: any) { // Especificar tipo 'any' para el error
        console.error('Error al descargar el código QR:', error);
        setError('Error al descargar el código QR.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{id ? 'Editar Producto' : 'Agregar Producto'}</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre Comercial"
            name="commercialName"
            value={product.commercialName}
            onChange={handleChange}
            required
          />
          <Input
            label="Nombre Genérico"
            name="genericName"
            value={product.genericName || ''}
            onChange={handleChange}
          />

          {/* Concentración Select with Manage Button */}
          <div className="flex items-end space-x-2">
            <Select
              label="Concentración"
              name="concentration"
              value={product.concentration || ''}
              onChange={handleChange}
              options={[{ value: '', label: 'Seleccionar Concentración' }, ...concentrations]}
            />
            <Button type="button" onClick={() => setShowConcentrationsModal(true)} variant="ghost" size="sm" className="mb-1">
              Gestionar
            </Button>
          </div>

          {/* Presentación Select with Manage Button */}
          <div className="flex items-end space-x-2">
            <Select
              label="Presentación"
              name="presentation"
              value={product.presentation || ''}
              onChange={handleChange}
              options={[{ value: '', label: 'Seleccionar Presentación' }, ...presentations]}
            />
            <Button type="button" onClick={() => setShowPresentationsModal(true)} variant="ghost" size="sm" className="mb-1">
              Gestionar
            </Button>
          </div>
          
          <Input
            label="Laboratorio"
            name="laboratory"
            value={product.laboratory || ''}
            onChange={handleChange}
          />

          <Input
            label="Precio de Costo"
            name="costPrice"
            type="number"
            value={product.costPrice}
            onChange={handleNumberChange}
            required
          />
          <Input
            label="Precio de Venta"
            name="sellingPrice"
            type="number"
            value={product.sellingPrice}
            onChange={handleNumberChange}
            required
          />
          <Input
            label="Stock Actual"
            name="currentStock"
            type="number"
            value={product.currentStock}
            onChange={handleNumberChange}
            required
          />
          <div className="flex items-end space-x-2">
            <Select
              label="Categoría"
              name="category"
              value={product.category}
              onChange={handleChange}
              options={categories.map(c => ({ value: c.name, label: c.name }))}
              required
            />
            <Button type="button" onClick={() => navigate(ROUTES.CATEGORIES)} variant="ghost" size="sm" className="mb-1">
              Gestionar
            </Button>
          </div>
          <Input
            label="Proveedor"
            name="supplier"
            value={product.supplier}
            onChange={handleChange}
          />
          <div>
          <Input
            label="Código de Barras"
            name="barcode"
            value={product.barcode}
            onChange={handleChange}
            ref={barcodeInputRef}
          />
          <Button type="button" onClick={generateBarcode} className="mt-2" disabled={!!product.barcode}>
            Generar Código de Barras (si está vacío)
          </Button>
          <Button type="button" onClick={() => setIsScannerActive(!isScannerActive)} className="mt-2 ml-2">
            {isScannerActive ? 'Cerrar Escáner' : 'Escanear con Cámara'}
          </Button>
        </div>
        {isScannerActive && (
          <div className="mt-4">
            <div id="qr-reader" style={{ width: "100%" }}></div>
          </div>
        )}
          {/* Eliminado el campo de Sucursal según la solicitud del usuario */}
          <Input
            label="URL de Imagen"
            name="imageUrl"
            value={product.imageUrl || ''}
            onChange={handleChange}
          />
          <Input
            label="Fecha de Vencimiento"
            name="expirationDate"
            type="date"
            value={product.expirationDate}
            onChange={handleChange}
          />
          <Input
            label="Unidad"
            name="unit"
            value={product.unit || ''}
            onChange={handleChange}
          />
          <Input
            label="Número de Lote"
            name="batchNumber"
            value={product.batchNumber || ''}
            onChange={handleChange}
          />
          <Input
            label="Ubicación"
            name="location"
            value={product.location || ''}
            onChange={handleChange}
          />
          <Input
            label="Nivel Mínimo de Stock"
            name="minStock"
            type="number"
            value={product.minStock}
            onChange={handleNumberChange}
          />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner /> : 'Guardar'}
          </Button>
          <Button type="button" onClick={() => navigate(ROUTES.PRODUCTS)} variant="secondary">
            Cancelar
          </Button>
        </div>

        {product.barcode && (
          <div className="mt-8 p-4 border rounded-md flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Código QR del Producto</h2>
            <div ref={qrCodeRef} className="p-2 bg-white">
              <QRCodeSVG value={product.barcode} size={256} level="H" />
            </div>
            <p className="mt-2 text-sm text-gray-600">{product.barcode}</p>
            <Button onClick={downloadQRCode} className="mt-4">
              Descargar QR
            </Button>
          </div>
        )}
      </form>

      {/* Modals for managing presentations and concentrations */}
      <ManagePresentationsModal
        isOpen={showPresentationsModal}
        onClose={() => setShowPresentationsModal(false)}
      />

      <ManageConcentrationsModal
        isOpen={showConcentrationsModal}
        onClose={() => setShowConcentrationsModal(false)}
      />

    </div>
  );
};

export default ProductFormPage;
