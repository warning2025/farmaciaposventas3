import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { getAllProducts } from '../services/productService';
import { createSale, onSalesUpdate, deleteSale, deleteSales, updateSaleStatus } from '../services/salesService';
import { Product, Sale, SaleItem, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { CURRENCY_SYMBOL } from '../constants'; // Added import for CURRENCY_SYMBOL

const SalesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmingSale, setIsConfirmingSale] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'qr' | 'transferencia' | 'tarjeta'>('efectivo');
  const [discount, setDiscount] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const { currentUser } = useAuth();
  const receiptToPrintRef = useRef<HTMLDivElement>(null);
  const productSearchInputRef = useRef<HTMLInputElement>(null); // Ref for the product search input
  const PHARMACY_NAME = "FARMA SANTIAGO CHIJMUNI"; // Define pharmacy name as a constant

  useEffect(() => {
    let branchIdToFilter: string | undefined;
    if (currentUser && currentUser.role !== UserRole.ADMIN && currentUser.branchAssignments) {
      const assignedBranchIds = Object.keys(currentUser.branchAssignments);
      if (assignedBranchIds.length > 0) {
        // Assuming the first assigned branch is the one to filter by for non-admin users
        branchIdToFilter = assignedBranchIds[0];
      }
    }

    console.log("SalesPage: currentUser", currentUser);
    console.log("SalesPage: branchIdToFilter", branchIdToFilter);

    const unsubscribe = onSalesUpdate((sales) => {
      console.log("SalesPage: Sales data received", sales);
      setSales(sales);
    }, branchIdToFilter); // Pass the branchId to filter sales
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    // Focus the product search input when the component mounts or sales are confirmed
    if (productSearchInputRef.current) {
      productSearchInputRef.current.focus(); // Corrected typo here
    }
  }, [isConfirmingSale]); // Re-focus after sale confirmation

  useEffect(() => {
    const fetchProducts = async () => {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filteredProducts = products.filter(product =>
        product.commercialName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) || // Added genericName to search
        product.barcode?.includes(searchQuery)
      );
      setSearchResults(filteredProducts);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, products]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery) {
      e.preventDefault(); // Prevent form submission
      const productByBarcode = products.find(product => product.barcode === searchQuery);
      if (productByBarcode) {
        handleAddToCart(productByBarcode);
      } else {
        alert('Producto no encontrado por código de barras.');
      }
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart(prevCart => {
      const existingProduct = prevCart.find(item => item.productId === product.id);
      if (existingProduct) {
        return prevCart.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice } : item
        );
      }
      return [...prevCart, { 
        productId: product.id!, 
        productName: `${product.commercialName} (${product.presentation || 'N/A'})`, // Include presentation in cart item name
        quantity: 1, 
        unitPrice: product.sellingPrice, 
        totalPrice: product.sellingPrice 
      }];
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId ? { ...item, quantity: quantity, totalPrice: quantity * item.unitPrice } : item
      )
    );
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    return subtotal - discount;
  };

  const generateReceiptContent = (sale: Sale | null, isNewSale: boolean = false) => {
    const itemsToPrint = isNewSale ? cart : (sale ? sale.items : []);
    const totalToPrint = isNewSale ? calculateTotal() : (sale ? sale.finalTotal : 0);
    const paymentMethodToPrint = isNewSale ? paymentMethod : (sale ? sale.paymentMethod : 'N/A');
    const subtotalToPrint = isNewSale ? cart.reduce((total, item) => total + item.totalPrice, 0) : (sale ? sale.subtotal : 0);
    const discountToPrint = isNewSale ? discount : (sale ? sale.totalDiscount : 0);
    const saleDateToPrint = isNewSale ? new Date() : (sale ? new Date(sale.date) : new Date());
    const saleIdToPrint = sale ? sale.id : 'N/A';
    const userNameToPrint = sale ? sale.userName : (currentUser?.displayName || currentUser?.email || 'N/A');

    return `
      <div style="font-family: sans-serif; padding: 20px; max-width: 400px; margin: auto; border: 1px solid #eee;">
        <h2 style="text-align: center; font-size: 24px; margin-bottom: 10px;">${PHARMACY_NAME}</h2>
        <p style="text-align: center; font-size: 14px; color: #555;">Recibo de Venta</p>
        <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;">
        <p><strong>ID Venta:</strong> ${saleIdToPrint}</p>
        <p><strong>Fecha:</strong> ${saleDateToPrint.toLocaleString()}</p>
        <p><strong>Cliente:</strong> ${userNameToPrint}</p>
        <p><strong>Método de Pago:</strong> ${paymentMethodToPrint}</p>
        <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;">
        <h3 style="font-size: 18px; margin-bottom: 10px;">Artículos</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 5px 0;">Producto</th>
              <th style="text-align: right; padding: 5px 0;">Cant.</th>
              <th style="text-align: right; padding: 5px 0;">Precio</th>
              <th style="text-align: right; padding: 5px 0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsToPrint.map(item => `
              <tr>
                <td style="text-align: left; padding: 5px 0;">${item.productName}</td>
                <td style="text-align: right; padding: 5px 0;">${item.quantity}</td>
                <td style="text-align: right; padding: 5px 0;">${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right; padding: 5px 0;">${item.totalPrice.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px dashed #ccc; margin: 15px 0;">
        <div style="text-align: right;">
          <p><strong>Subtotal:</strong> ${subtotalToPrint.toFixed(2)}</p>
          <p><strong>Descuento:</strong> ${discountToPrint.toFixed(2)}</p>
          <p style="font-size: 20px; font-weight: bold;"><strong>Total:</strong> ${totalToPrint.toFixed(2)}</p>
        </div>
      </div>
    `;
  };

  const handlePrint = (saleToPrint: Sale | null = null) => {
    const content = saleToPrint ? generateReceiptContent(saleToPrint) : generateReceiptContent(null, true);
    
    const receiptWindow = window.open('', '', 'width=800,height=600');
    receiptWindow?.document.write('<html><head><title>Recibo</title>');
    receiptWindow?.document.write('<style>body { font-family: sans-serif; }</style>'); // Basic styling
    receiptWindow?.document.write('</head><body>');
    receiptWindow?.document.write(content);
    receiptWindow?.document.write('</body></html>');
    receiptWindow?.document.close();
    receiptWindow?.print();
  };

  const handleConfirmSale = async () => {
    if (!currentUser) {
      alert('Debes iniciar sesión para registrar una venta.');
      return;
    }
    setIsConfirmingSale(true);
    try {
      const subtotal = cart.reduce((total, item) => total + item.totalPrice, 0);

      let saleBranchId: string | undefined;
      if (currentUser && currentUser.branchAssignments) {
        const assignedBranchIds = Object.keys(currentUser.branchAssignments);
        if (assignedBranchIds.length > 0) {
          saleBranchId = assignedBranchIds[0];
        }
      }

      if (!saleBranchId) {
        alert('No se pudo determinar la sucursal para registrar la venta. Asegúrate de que el usuario tenga una sucursal asignada.');
        setIsConfirmingSale(false);
        return;
      }

      await createSale({
        branchId: saleBranchId,
        items: cart,
        subtotal: subtotal,
        totalDiscount: discount,
        finalTotal: subtotal - discount,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'N/A',
        paymentMethod: paymentMethod,
        channel: 'pos',
      }, cart);
      alert('Venta registrada con éxito.');
      handlePrint(null); // Call handlePrint for new sale
      setCart([]);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating sale: ", error);
      alert('Error al registrar la venta.');
    } finally {
      setIsConfirmingSale(false);
    }
  };

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setIsViewModalOpen(true);
  };

  const handleDeleteSale = async (sale: Sale) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esta acción repondrá el inventario.')) {
      try {
        if (!sale.id) throw new Error("Sale ID is missing");
        await deleteSale(sale.id, sale.items, sale.finalTotal);
        alert('Venta eliminada con éxito.');
      } catch (error) {
        console.error("Error deleting sale: ", error);
        alert('Error al eliminar la venta.');
      }
    }
  };

  const handleSelectSale = (saleId: string) => {
    setSelectedSales(prev =>
      prev.includes(saleId) ? prev.filter(id => id !== saleId) : [...prev, saleId]
    );
  };

  const handleDeleteSelectedSales = async () => {
    if (selectedSales.length === 0) {
      alert('No hay ventas seleccionadas para eliminar.');
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedSales.length} ventas? Esta acción repondrá el inventario.`)) {
      try {
        const salesToDelete = sales.filter(sale => selectedSales.includes(sale.id!));
        await deleteSales(salesToDelete);
        alert('Ventas eliminadas con éxito.');
        setSelectedSales([]);
      } catch (error) {
        console.error("Error deleting selected sales: ", error);
        alert('Error al eliminar las ventas seleccionadas.');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('El carrito está vacío.');
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Nueva Venta</h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="product" className="block text-sm font-medium text-gray-300">Producto</label>
              <Input
                type="text"
                id="product"
                name="product"
                placeholder="Buscar producto por nombre o código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown} // Add keydown handler
                ref={productSearchInputRef} // Attach ref
              />
              {searchResults.length > 0 && (
                <ul className="bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto text-white">
                  {searchResults.map(product => (
                    <li
                      key={product.id}
                      className="p-2 hover:bg-gray-600 cursor-pointer"
                      onClick={() => handleAddToCart(product)}
                    >
                      {product.commercialName} {product.concentration ? `(${product.concentration} mg)` : ''} {product.presentation ? `(${product.presentation})` : ''} {product.laboratory ? `(${product.laboratory})` : ''} - {CURRENCY_SYMBOL} {product.sellingPrice.toFixed(2)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-300">Método de Pago</label>
              <select id="paymentMethod" name="paymentMethod" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'qr' | 'transferencia' | 'tarjeta')}>
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            <div className="mt-4">
              <Button type="submit" className="w-full">Registrar Venta</Button>
            </div>
          </div>
        </form>
      </Card>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Carrito</h2>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Producto</th>
                  <th scope="col" className="px-6 py-3">Precio</th>
                  <th scope="col" className="px-6 py-3">Cantidad</th>
                  <th scope="col" className="px-6 py-3">Subtotal</th>
                  <th scope="col" className="px-6 py-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.productId} className="bg-gray-800 border-b border-gray-700">
                    <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{item.productName}</td>
                    <td className="px-6 py-4">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleUpdateQuantity(item.productId, parseInt(e.target.value))}
                        className="w-20 bg-gray-700 border-gray-600"
                      />
                    </td>
                    <td className="px-6 py-4">{item.totalPrice.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Button onClick={() => handleRemoveFromCart(item.productId)} variant="danger" size="sm">Eliminar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-gray-700 rounded-b-lg">
            <div className="flex justify-between items-center text-white">
              <span>Subtotal:</span>
              <span>{cart.reduce((total, item) => total + item.totalPrice, 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 text-white">
              <span>Descuento:</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-24 bg-gray-800 border-gray-600 text-right"
              />
            </div>
            <div className="flex justify-between items-center mt-2 text-white">
              <span>Cantidad de Productos:</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
            <hr className="my-2 border-gray-600" />
            <div className="flex justify-between items-center mt-2 text-xl font-bold text-white">
              <span>Total:</span>
              <span>{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Registro de Ventas</h2>
        {currentUser?.role === UserRole.ADMIN && selectedSales.length > 0 && (
          <div className="mb-4">
            <Button onClick={handleDeleteSelectedSales} variant="danger">
              Eliminar Seleccionadas ({selectedSales.length})
            </Button>
          </div>
        )}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
              <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                <tr>
                  {currentUser?.role === UserRole.ADMIN && (
                    <th scope="col" className="p-4">
                      <div className="flex items-center">
                        <input id="checkbox-all" type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSales(sales.map(s => s.id!));
                            }
                            else {
                              setSelectedSales([]);
                            }
                          }}
                          checked={selectedSales.length === sales.length && sales.length > 0}
                        />
                        <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                      </div>
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3">Fecha</th>
                  <th scope="col" className="px-6 py-3">Cliente</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                  <th scope="col" className="px-6 py-3">Canal / Estado</th>
                  <th scope="col" className="px-6 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(sale => (
                  <tr key={sale.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                    {currentUser?.role === UserRole.ADMIN && (
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input id={`checkbox-${sale.id}`} type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            checked={selectedSales.includes(sale.id!)}
                            onChange={() => handleSelectSale(sale.id!)}
                          />
                          <label htmlFor={`checkbox-${sale.id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-6 py-4">{sale.userName}</td>
                    <td className="px-6 py-4">{sale.finalTotal.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {sale.channel === 'online' ? (
                        <select
                          value={sale.status}
                          onChange={(e) => updateSaleStatus(sale.id!, e.target.value as any)}
                          className="bg-gray-700 border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="processing">En Proceso</option>
                          <option value="completed">Completado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      ) : (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">En Tienda</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Button onClick={() => handleViewSale(sale)} size="sm" className="mr-2">Ver</Button>
                      {sale.channel === 'online' && (
                        <Button onClick={() => {
                          setSelectedSale(sale);
                          setIsCustomerModalOpen(true);
                        }} size="sm" className="mr-2">Cliente</Button>
                      )}
                      {currentUser?.role === UserRole.ADMIN && (
                        <Button onClick={() => handleDeleteSale(sale)} variant="danger" size="sm">Eliminar</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirmar Venta">
        <div ref={receiptToPrintRef} style={{ display: 'none' }}>
            <h2 className="text-xl font-bold text-center">Recibo de Venta</h2>
            <p className="text-center">Farmacia Unzueta</p>
            <hr className="my-2" />
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left">Producto</th>
                  <th className="text-right">Cant.</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                    <td className="text-right">{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className="my-2" />
            <div className="text-right">
              <p><strong>Total:</strong> {calculateTotal().toFixed(2)}</p>
              <p><strong>Método de Pago:</strong> {paymentMethod}</p>
            </div>
        </div>
        <p className='text-gray-800 dark:text-white'>¿Confirmar la venta?</p>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setIsModalOpen(false)} variant="secondary" className="mr-2" disabled={isConfirmingSale}>Cancelar</Button>
          <Button onClick={handleConfirmSale} disabled={isConfirmingSale}>
            {isConfirmingSale ? 'Confirmando...' : 'Confirmar e Imprimir'}
          </Button>
        </div>
      </Modal>

      {selectedSale && (
        <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Detalle de Venta" size="xl">
          <div className="p-4 text-gray-800 dark:text-white">
            <p><strong>ID Venta:</strong> {selectedSale.id}</p>
            <p><strong>Fecha:</strong> {new Date(selectedSale.date).toLocaleString()}</p>
            <p><strong>Cliente:</strong> {selectedSale.userName}</p>
            <p><strong>Método de Pago:</strong> {selectedSale.paymentMethod}</p>
            <h3 className="text-lg font-bold mt-4 mb-2 text-gray-800 dark:text-white">Artículos</h3>
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Producto</th>
                  <th scope="col" className="px-6 py-3">Cantidad</th>
                  <th scope="col" className="px-6 py-3">Precio Unit.</th>
                  <th scope="col" className="px-6 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map(item => (
                  <tr key={item.productId} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.productName}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right mt-4 text-gray-800 dark:text-white">
              <p><strong>Subtotal:</strong> {selectedSale.subtotal.toFixed(2)}</p>
              <p><strong>Descuento:</strong> {selectedSale.totalDiscount.toFixed(2)}</p>
              <p className="text-xl font-bold"><strong>Total:</strong> {selectedSale.finalTotal.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            {currentUser?.role === UserRole.ADMIN && selectedSale && (
              <Button onClick={() => handlePrint(selectedSale)} className="mr-2">Reimprimir</Button>
            )}
            <Button onClick={() => setIsViewModalOpen(false)} variant="secondary">Cerrar</Button>
          </div>
        </Modal>
      )}

      {selectedSale && (
        <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} title="Información del Cliente">
          <div>
            <p><strong>Nombre:</strong> {selectedSale.userName}</p>
            <p><strong>Teléfono:</strong> {selectedSale.customerPhone}</p>
            <a
              href={`https://wa.me/${selectedSale.customerPhone}?text=Hola%20${selectedSale.userName},%20tu%20pedido%20de%20FARMA%20SANTIAGO%20CHIJMUNI%20está%20siendo%20procesado.`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full mt-4">Notificar por WhatsApp</Button>
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SalesPage;
