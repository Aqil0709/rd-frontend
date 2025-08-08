import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  ShoppingCart,
  BarChart2,
  LayoutDashboard,
  IndianRupee, // Make sure IndianRupee is imported
  Info, // For better error/info messages
  XCircle, // For error icons
  Menu, // For a mobile menu toggle
} from 'lucide-react';

// --- Import the new management sections ---
import OrderManagementSection from './OrderManagementSection';
import StockManagementSection from './StockManagementSection';

// --- Reusable Skeleton Loader Component ---
const SkeletonRow = ({ columns }) => (
  <tr className="animate-pulse border-b border-gray-200">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
      </td>
    ))}
  </tr>
);

// --- Product Table Row Component ---
const ProductTableRow = ({ product, navigate, t, onDelete, onEdit }) => (
  <tr
    key={product.id}
    className="border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ease-in-out group"
  >
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 relative">
          <img
            className="h-10 w-10 rounded-lg object-cover border border-gray-200 shadow-sm transition-transform duration-200 group-hover:scale-105"
            src={
              product.images && product.images.length > 0
                ? product.images[0]
                : 'https://placehold.co/40x40/e2e8f0/000000?text=No+Image'
            }
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://placehold.co/40x40/e2e8f0/000000?text=Error';
            }} // Fallback on image error
          />
        </div>
        <div className="ml-4">
          <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
            {product.name}
          </div>
          <div className="text-xs text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-xs">
            {product.description
              ? product.description.substring(0, 70) +
                (product.description.length > 70 ? '...' : '')
              : t('noDescription')}
          </div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
      <span className="inline-flex px-3 py-1 text-xs font-semibold leading-5 rounded-full bg-blue-100 text-blue-800">
        {product.category}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
      ₹{product.price.toLocaleString('en-IN')}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <button
        onClick={() => onEdit(product)}
        className="text-indigo-600 hover:text-indigo-800 mr-3 p-2 rounded-full hover:bg-indigo-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transform hover:scale-110"
        title={t('editProduct')}
      >
        <Edit className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete(product.id)}
        className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transform hover:scale-110"
        title={t('deleteProduct')}
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </td>
  </tr>
);

// --- Product Management Section Component ---
const ProductManagementSection = ({
  products,
  navigate,
  t,
  isLoading,
  error,
  fetchProducts,
  deleteProduct,
  handleEditProduct,
  searchTerm,
  setSearchTerm,
  filterCategory,
  setFilterCategory,
}) => {
  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === '' || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section className="p-6 bg-white rounded-lg shadow-xl border border-gray-100 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">
          {t('Product Management')}
        </h2>
        <button
          onClick={() => navigate('adminAddProduct')}
          className="bg-blue-600 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center shadow-md hover:bg-blue-700 transition-colors duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('Add New Product')}
        </button>
      </div>

      <div className="mb-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder={t('searchProductsPlaceholder')}
            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
        <select
          className="px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out sm:w-auto"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-md">
        {isLoading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg font-medium">{t('loadingProducts')}</p>
            <table className="min-w-full divide-y divide-gray-200 mt-4">
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={4} />
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50 flex flex-col items-center justify-center">
            <XCircle className="h-12 w-12 mb-4" />
            <p className="text-xl font-semibold mb-2">
              {t('errorLoadingProducts')}
            </p>
            <p className="text-sm text-red-700 mb-4">{error.message || error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              {t('tryAgain')}
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-gray-50 flex flex-col items-center justify-center">
            <Info className="h-12 w-12 mb-4 text-gray-400" />
            <p className="text-xl font-semibold mb-2">
              {t('noProductsFound')}
            </p>
            <p className="text-sm text-gray-600">
              {t('tryAdjustingFilters')} or{' '}
              <button
                onClick={() => navigate('adminAddProduct')}
                className="text-blue-600 hover:underline font-medium"
              >
                {t('Add New Product Now')}
              </button>
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('product')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    navigate={navigate}
                    t={t}
                    onDelete={deleteProduct}
                    onEdit={handleEditProduct}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Dashboard Overview Section Component ---
const DashboardOverviewSection = ({ t, products, orders, navigate, handleSetActiveTab }) => { // Added handleSetActiveTab prop
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  // Helper for animated counts
  const AnimatedNumber = ({ value }) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      let start = 0;
      const end = value;
      if (start === end) return;

      const duration = 1000;
      let startTime = null;

      const animateStep = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / duration;
        const currentCount = Math.floor(progress * (end - start) + start);
        setCount(currentCount);
        if (progress < 1) {
          requestAnimationFrame(animateStep);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animateStep);
    }, [value]);

    return count;
  };

  return (
    <section className="p-6 bg-white rounded-lg shadow-xl border border-gray-100 animate-fade-in">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Products */}
        <div className="bg-blue-50 p-6 rounded-lg shadow-md flex items-center space-x-4 border border-blue-100 transform hover:scale-102 transition-transform duration-200 ease-in-out">
          <Package className="h-12 w-12 text-blue-600 flex-shrink-0" />
          <div>
            <p className="text-gray-600 text-sm font-medium">
              {t('Total Products')}
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              <AnimatedNumber value={totalProducts} />
            </p>
          </div>
        </div>
        {/* Card 2: Total Orders */}
        <div className="bg-green-50 p-6 rounded-lg shadow-md flex items-center space-x-4 border border-green-100 transform hover:scale-102 transition-transform duration-200 ease-in-out">
          <ShoppingCart className="h-12 w-12 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-gray-600 text-sm font-medium">
              {t('Total Orders')}
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              <AnimatedNumber value={totalOrders} />
            </p>
          </div>
        </div>
        {/* Card 3: Total Revenue */}
        <div className="bg-purple-50 p-6 rounded-lg shadow-md flex items-center space-x-4 border border-purple-100 transform hover:scale-102 transition-transform duration-200 ease-in-out">
          <IndianRupee className="h-12 w-12 text-purple-600 flex-shrink-0" />
          <div>
            <p className="text-gray-600 text-sm font-medium">
              {t('Total Revenue')}
            </p>
            <p className="text-3xl font-extrabold text-gray-900 mt-1">
              ₹
              <AnimatedNumber value={totalRevenue} />
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          {t('Quick Actions')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => handleSetActiveTab('products')} 
            className="flex items-center justify-center p-4 bg-blue-100 text-blue-800 rounded-lg shadow-sm hover:bg-blue-200 transition-all duration-200 font-semibold transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="h-5 w-5 mr-2" /> {t('Add Product')}
          </button>
          <button
            onClick={() => handleSetActiveTab('orders')} 
            className="flex items-center justify-center p-4 bg-green-100 text-green-800 rounded-lg shadow-sm hover:bg-green-200 transition-all duration-200 font-semibold transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <ShoppingCart className="h-5 w-5 mr-2" /> {t('View Orders')}
          </button>
          <button
            onClick={() => handleSetActiveTab('stock')}
            className="flex items-center justify-center p-4 bg-purple-100 text-purple-800 rounded-lg shadow-sm hover:bg-purple-200 transition-all duration-200 font-semibold transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <BarChart2 className="h-5 w-5 mr-2" /> {t('Manage Stock')}
          </button>
        </div>
      </div>
    </section>
  );
};

// --- Admin Dashboard Page Component (Main) ---
const AdminDashboardPage = () => {
  const {
    products,
    navigate,
    t,
    isLoading,
    error,
    fetchProducts,
    deleteProduct,
    setSelectedProduct,
    orders,
    isLoadingOrders,
    errorOrders,
    fetchOrders,
    stock,
    isLoadingStock,
    errorStock,
    fetchStock,
    updateStock,
  } = useContext(AppContext);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // Default to 'overview'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile menu toggle

  // Memoize handlers to prevent unnecessary re-renders of child components
  const handleDeleteProduct = useCallback(
    async (productId) => {
      if (
        window.confirm(
          t('confirmDeleteProduct', {
            productName:
              products.find((p) => p.id === productId)?.name || 'this product',
          })
        )
      ) {
        try {
          await deleteProduct(productId);
          // Optional: Show a success toast/notification
        } catch (err) {
          console.error('Error deleting product:', err);
          // Optional: Show a user-friendly error notification
        }
      }
    },
    [deleteProduct, t, products]
  );

  const handleEditProduct = useCallback(
    (productToEdit) => {
      setSelectedProduct(productToEdit);
      navigate('adminAddProduct'); // Navigate to the add/edit product page
      if (isMobileMenuOpen) setIsMobileMenuOpen(false); // Close menu after navigation
    },
    [setSelectedProduct, navigate, isMobileMenuOpen]
  );

  // Unified data fetching logic based on active tab
  useEffect(() => {
    setSelectedProduct(null); // Clear any previously selected product when entering the dashboard or changing tabs

    const fetchData = async () => {
      switch (activeTab) {
        case 'overview':
          await fetchProducts();
          await fetchOrders();
          break;
        case 'products':
          await fetchProducts();
          break;
        case 'orders':
          await fetchOrders();
          break;
        case 'stock':
          await fetchStock();
          break;
        default:
          break;
      }
    };

    fetchData();
  }, [
    activeTab,
    fetchProducts,
    fetchOrders,
    fetchStock,
    setSelectedProduct,
  ]);

  // Handler to set active tab and close mobile menu if open
  const handleSetActiveTab = useCallback((tabName) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false); // Close mobile menu when a tab is selected
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen font-inter">
      <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 text-center drop-shadow-sm lg:mb-8">
        {t('')}
      </h1>

      {/* Mobile Menu Toggle (Visible on small screens) */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center shadow-md hover:bg-blue-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Menu className="mr-2 h-5 w-5" />
          {isMobileMenuOpen ? t('') : t('Menu')}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar Navigation (Conditional visibility) */}
        <div
          className={`lg:w-1/4 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden
                      ${isMobileMenuOpen ? 'block' : 'hidden'} lg:block
                      ${
                        isMobileMenuOpen
                          ? 'w-full mb-6'
                          : 'lg:sticky lg:top-4 lg:self-start lg:h-fit'
                      }
                      transition-all duration-300 ease-in-out`}
        >
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
            <h3 className="text-xl font-bold text-gray-800">
              {t('Navigation')}
            </h3>
          </div>
          <nav className="py-4">
            <button
              className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-all duration-200 ease-in-out transform hover:translate-x-1 ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleSetActiveTab('overview')}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" /> {t('Overview')}
            </button>
            <button
              className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-all duration-200 ease-in-out transform hover:translate-x-1 ${
                activeTab === 'products'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleSetActiveTab('products')}
            >
              <Package className="h-5 w-5 mr-3" /> {t('Product Management')}
            </button>
            <button
              className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-all duration-200 ease-in-out transform hover:translate-x-1 ${
                activeTab === 'orders'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleSetActiveTab('orders')}
            >
              <ShoppingCart className="h-5 w-5 mr-3" /> {t('Order Management')}
            </button>
            <button
              className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-all duration-200 ease-in-out transform hover:translate-x-1 ${
                activeTab === 'stock'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleSetActiveTab('stock')}
            >
              <BarChart2 className="h-5 w-5 mr-3" /> {t('Stock Management')}
            </button>
            {/* You can add more navigation items here following the same pattern */}
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="lg:w-3/4 flex-grow">
          {activeTab === 'overview' && (
            <DashboardOverviewSection
              t={t}
              products={products}
              orders={orders}
              navigate={navigate}
              handleSetActiveTab={handleSetActiveTab} 
            />
          )}
          {activeTab === 'products' && (
            <ProductManagementSection
              products={products}
              navigate={navigate}
              t={t}
              isLoading={isLoading}
              error={error}
              fetchProducts={fetchProducts}
              deleteProduct={handleDeleteProduct}
              handleEditProduct={handleEditProduct}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              filterCategory={filterCategory}
              setFilterCategory={setFilterCategory}
            />
          )}
          {activeTab === 'orders' && (
            <OrderManagementSection
              orders={orders}
              isLoadingOrders={isLoadingOrders}
              errorOrders={errorOrders}
              fetchOrders={fetchOrders}
              t={t}
            />
          )}
          {activeTab === 'stock' && (
            <StockManagementSection
              products={products} // Often stock is related to products, so pass them if needed
              stock={stock}
              isLoadingStock={isLoadingStock}
              errorStock={errorStock}
              fetchStock={fetchStock}
              updateStock={updateStock}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;