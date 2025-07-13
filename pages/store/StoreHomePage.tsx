import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Category } from '../../types';
import { getAllProducts } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { useCart } from '../../contexts/CartContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import StickyCart from '../../components/store/StickyCart';
import { ShoppingCart, Search } from 'lucide-react';

const StoreHomePage: React.FC = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, allCategories] = await Promise.all([
          getAllProducts(),
          getCategories()
        ]);
        setProducts(allProducts.filter(p => p.currentStock > 0));
        setCategories([{ id: 'All', name: 'Todas' }, ...allCategories]);
      } catch (error) {
        console.error("Error fetching data for store:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    // Consider using a toast notification instead of an alert for better UX
  };

 const filteredProducts = useMemo(() => {
    let byCategory = products;
    if (selectedCategory !== 'Todas') {
      byCategory = products.filter(p => p.category === selectedCategory);
    }

    return byCategory.filter(product =>
      product.commercialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery, selectedCategory]);

  const groupedProducts = useMemo(() => {
    const group: Record<string, Product[]> = {};
    filteredProducts.forEach(product => {
      const categoryName = product.category || 'Otros';
      if (!group[categoryName]) {
        group[categoryName] = [];
      }
      group[categoryName].push(product);
    });
    return group;
  }, [filteredProducts]);

 const categoriesWithProducts = useMemo(() => {
    const productCountPerCategory: Record<string, boolean> = {};
    products.forEach(p => {
      if (p.category) {
        productCountPerCategory[p.category] = true;
      }
    });
    return categories.filter(c => c.name === 'Todas' || productCountPerCategory[c.name]);
  }, [categories, products]);

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName);
    mainContentRef.current?.scrollTo(0, 0);
  };

  return (
<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
        
        {/* Categories */}
        <div className="flex flex-wrap justify-center mb-6">
          {categoriesWithProducts.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.name)}
              className={`px-4 py-2 rounded-md m-1 transition-colors text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedCategory === category.name ? 'bg-cyan-100 dark:bg-cyan-800/50 text-cyan-700 dark:text-cyan-300 font-semibold' : ''}`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p>Cargando productos...</p>
          ) : (
            Object.values(groupedProducts).flatMap(productsInCategory =>
              productsInCategory.map(product => (
                <Card key={product.id} className="flex flex-col overflow-hidden group p-0">
                  <div className="relative">
                    <img
                      src={product.imageUrl || 'https://via.placeholder.com/300x300.png?text=Sin+Imagen'}
                      alt={product.commercialName}
                      className="w-full h-40 object-cover"
                    />
                  </div>
                  <div className="p-4 flex-grow flex flex-col">
                    <h3 className="font-bold mb-1 flex-grow" title={product.commercialName}>{product.commercialName}</h3>
                    <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400 mb-3">
                      {product.sellingPrice.toFixed(2)} Bs.
                    </p>
                    <Button onClick={() => handleAddToCart(product)} className="w-full mt-auto" icon={<ShoppingCart size={16} />}>
                      Añadir
                    </Button>
                  </div>
                </Card>
              ))
            )
          )}
        </div>
      
    </div>
  );
};

export default StoreHomePage;
