import React, { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Package, AlertTriangle, CheckCircle, Plus, Edit, BarChart2, XCircle } from 'lucide-react'; // Ensured XCircle is explicitly imported

// Reusable spinner component
const Spinner = ({ className = 'h-5 w-5', color = 'border-blue-500' }) => (
    <div className={`animate-spin rounded-full ${className} border-b-2 ${color} mr-3`}></div>
);

const StockManagementSection = () => {
    const { products, stock, isLoadingStock, errorStock, fetchStock, updateStock, addStockItem, generateNewProductWithInitialStock, t } = useContext(AppContext);

    const [stockQuantities, setStockQuantities] = useState({});
    const [newProductName, setNewProductName] = useState('');
    const [newQuantityToAdd, setNewQuantityToAdd] = useState('');
    const [addStockError, setAddStockError] = useState('');
    const [isAddingStock, setIsAddingStock] = useState(false);
    const [isGeneratingProduct, setIsGeneratingProduct] = useState(false);
    const [updateStatus, setUpdateStatus] = useState({}); // To show individual update status (loading/success/error)

    const [formSuccessMessage, setFormSuccessMessage] = useState('');
    const [formErrorMessage, setFormErrorMessage] = useState('');

    // Memoize fetchStock if it's not already memoized in AppContext
    useEffect(() => {
        fetchStock();
    }, [fetchStock]);

    // Initialize stock quantities when stock data changes
    useEffect(() => {
        const initialQuantities = {};
        stock.forEach(item => {
            initialQuantities[item.product_id] = item.quantity;
        });
        setStockQuantities(initialQuantities);
    }, [stock]);

    // Handle quantity changes in the input fields
    const handleQuantityChange = (productId, value) => {
        setStockQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, parseInt(value, 10) || 0) // Ensure non-negative integer
        }));
    };

    // Handle updating an existing product's stock
    const handleUpdateStock = async (productId) => {
        const newQuantity = stockQuantities[productId];
        if (newQuantity === undefined || newQuantity < 0) {
            setUpdateStatus(prev => ({ ...prev, [productId]: { status: 'error', message: t('invalidStockQuantity') } }));
            setTimeout(() => setUpdateStatus(prev => ({ ...prev, [productId]: null })), 3000); // Clear after 3 seconds
            return;
        }

        setUpdateStatus(prev => ({ ...prev, [productId]: { status: 'loading' } }));
        const productToUpdate = products.find(p => p.id === productId);
        const productName = productToUpdate ? productToUpdate.name : null;

        try {
            await updateStock(productId, newQuantity, productName);
            setUpdateStatus(prev => ({ ...prev, [productId]: { status: 'success', message: t('stockUpdatedSuccessfully') } }));
        } catch (error) {
            console.error("Error updating stock:", error);
            setUpdateStatus(prev => ({ ...prev, [productId]: { status: 'error', message: error.message || t('failedToUpdateStock') } }));
        } finally {
            setTimeout(() => setUpdateStatus(prev => ({ ...prev, [productId]: null })), 3000); // Clear status after 3 seconds
        }
    };

    // Handle adding new stock for an existing product
    const handleAddStock = async (e) => {
        e.preventDefault();
        setAddStockError('');
        setFormSuccessMessage('');
        setFormErrorMessage('');
        setIsAddingStock(true);

        const trimmedProductName = newProductName.trim();
        const parsedQuantity = parseInt(newQuantityToAdd, 10);

        if (!trimmedProductName) {
            setAddStockError(t('pleaseEnterProductName'));
            setIsAddingStock(false);
            return;
        }

        const productToAddStockFor = products.find(
            p => p.name && p.name.toLowerCase() === trimmedProductName.toLowerCase()
        );

        if (!productToAddStockFor) {
            setAddStockError(t('productNotFoundByName'));
            setIsAddingStock(false);
            return;
        }

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) { // Quantity should be positive for adding new stock
            setAddStockError(t('pleaseEnterValidPositiveQuantity'));
            setIsAddingStock(false);
            return;
        }

        const productId = productToAddStockFor.id;
        const productName = productToAddStockFor.name;

        try {
            await addStockItem(productId, parsedQuantity, productName);
            setNewProductName('');
            setNewQuantityToAdd('');
            setFormSuccessMessage(t('stockAddedSuccessfullyFor', { productName }));
        } catch (error) {
            console.error("Error adding new stock:", error);
            setFormErrorMessage(error.message || t('failedToAddStock'));
        } finally {
            setIsAddingStock(false);
            setTimeout(() => {
                setFormSuccessMessage('');
                setFormErrorMessage('');
            }, 5000); // Clear messages after 5 seconds
        }
    };

    // Handle generating a new product with initial stock
    const handleGenerateProduct = async () => {
        setIsGeneratingProduct(true);
        setFormSuccessMessage('');
        setFormErrorMessage('');
        try {
            const generatedProduct = await generateNewProductWithInitialStock();
            if (generatedProduct) {
                setFormSuccessMessage(t('productGeneratedSuccessfully', { productName: generatedProduct.name }));
            }
        } catch (error) {
            console.error("Error generating product:", error);
            setFormErrorMessage(error.message || t('failedToGenerateProduct'));
        } finally {
            setIsGeneratingProduct(false);
            setTimeout(() => {
                setFormSuccessMessage('');
                setFormErrorMessage('');
            }, 5000); // Clear messages after 5 seconds
        }
    };

    // Calculate stock overview stats
    const totalStockedItems = stock.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItemsCount = stock.filter(item => item.quantity < 10).length; // Example: low stock if < 10
    const outOfStockItemsCount = stock.filter(item => item.quantity === 0).length;

    // --- Loading and Error States for Initial Fetch ---
    if (isLoadingStock && stock.length === 0 && !errorStock) {
        return (
            <div className="text-center py-8">
                <Spinner className="h-10 w-10" color="border-gray-900" />
                <p className="text-gray-700 mt-2">{t('loadingStock')}</p>
            </div>
        );
    }

    if (errorStock) {
        return (
            <div className="text-center py-8 text-red-600">
                <p className="mb-4">{t('errorLoadingStock')}: {errorStock}</p>
                <button onClick={fetchStock} className="mt-4 bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
                    {t('tryAgain')}
                </button>
            </div>
        );
    }
    console.log("Products Array:", products);
console.log("Stock Array:", stock);

    return (
        <div className="bg-white shadow-xl rounded-lg p-8 md:p-10 border border-gray-200">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4">{t('Stock Management')}</h2>

            {/* Stock Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-blue-50 p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <Package className="h-10 w-10 text-blue-600" />
                    <div>
                        <p className="text-gray-600 text-sm">{t('Total Stocked Items')}</p>
                        <p className="text-2xl font-bold text-gray-900">{totalStockedItems}</p>
                    </div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <AlertTriangle className="h-10 w-10 text-yellow-600" />
                    <div>
                        <p className="text-gray-600 text-sm">{t('Low Stock Items')}</p>
                        <p className="text-2xl font-bold text-gray-900">{lowStockItemsCount}</p>
                    </div>
                </div>
                <div className="bg-red-50 p-6 rounded-lg shadow-md flex items-center space-x-4">
                    <XCircle className="h-10 w-10 text-red-600" />
                    <div>
                        <p className="text-gray-600 text-sm">{t('Out Of Stock Items')}</p>
                        <p className="text-2xl font-bold text-gray-900">{outOfStockItemsCount}</p>
                    </div>
                </div>
            </div>

            {/* Global success/error messages for form submissions */}
            {formSuccessMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <strong className="font-bold">{t('success')}!</strong>
                    <span className="block sm:inline"> {formSuccessMessage}</span>
                </div>
            )}
            {formErrorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <strong className="font-bold">{t('error')}!</strong>
                    <span className="block sm:inline"> {formErrorMessage}</span>
                </div>
            )}

            {/* --- Add New Stock Form --- */}
            <div className="mb-10 p-6 bg-gray-50 rounded-lg shadow-md border border-gray-100">
                <h3 className="text-2xl font-bold text-gray-800 mb-5 flex items-center"><Plus className="h-6 w-6 mr-2 text-green-600" />{t('Add New Stock')}</h3>
                <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="newProductName" className="block text-sm font-medium text-gray-700 mb-1">{t('productName')}</label>
                        <input
                            type="text"
                            id="newProductName"
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={t('enterProductName')}
                            list="productNames"
                            required
                        />
                        <datalist id="productNames">
                            {products.map(product => (
                                <option key={product.id} value={product.name} />
                            ))}
                        </datalist>
                    </div>
                    <div>
                        <label htmlFor="newQuantityToAdd" className="block text-sm font-medium text-gray-700 mb-1">{t('Quantity')}</label>
                        <input
                            type="number"
                            id="newQuantityToAdd"
                            value={newQuantityToAdd}
                            onChange={(e) => setNewQuantityToAdd(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder={t('enterQuantity')}
                            min="1" // Minimum quantity for adding should be 1
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        {addStockError && <p className="text-red-600 text-sm mt-2">{addStockError}</p>}
                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            disabled={isAddingStock}
                        >
                            {isAddingStock ? (
                                <>
                                    <Spinner color="border-white" />
                                    {t('addingStock')}
                                </>
                            ) : (
                                t('addStock')
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Generate New Product Button --- */}
            

            {/* --- Existing Stock Table --- */}
            <h3 className="text-2xl font-bold text-gray-900 mb-5 border-b pb-3">{t('Current Stock Levels')}</h3>
            {stock.length === 0 && !isLoadingStock ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg shadow-inner">
                    <p className="text-lg mb-2">{t('noStockDataFound')}</p>
                    <p>{t('useTheFormAboveToAddStock')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('productName')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('currentStock')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('updateQuantity')}</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>

<tbody className="bg-white divide-y divide-gray-200">
    {stock.map(stockItem => {
        // Find the full product details from the 'products' array
        // by matching the ID from the 'stockItem'.
        const product = products.find(p => p.id === stockItem.id);
        const currentUpdateStatus = updateStatus[stockItem.id];

        return (
            <tr key={stockItem.id} className="hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {/* If the product is found, show its name. Otherwise, show the ID as a fallback. */}
                    {product ? product.name : `ID: ${stockItem.id}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {stockItem.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <input
                        type="number"
                        min="0"
                        value={stockQuantities[stockItem.id] !== undefined ? stockQuantities[stockItem.id] : stockItem.quantity}
                        onChange={(e) => handleQuantityChange(stockItem.id, e.target.value)}
                        className="w-28 p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label={`${t('updateQuantityFor')} ${product ? product.name : stockItem.id}`}
                    />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={() => handleUpdateStock(stockItem.id)}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-lg flex items-center justify-center ml-auto hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        disabled={currentUpdateStatus?.status === 'loading' || isLoadingStock}
                    >
                         {currentUpdateStatus?.status === 'loading' ? (
                            <>
                                <Spinner className="h-4 w-4" color="border-white" />
                                {t('updating')}
                            </>
                        ) : (
                            t('Update')
                        )}
                    </button>
                    {currentUpdateStatus && currentUpdateStatus.status !== 'loading' && (
                        <p className={`mt-1 text-xs ${currentUpdateStatus.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                            {currentUpdateStatus.message}
                        </p>
                    )}
                </td>
            </tr>
        );
    })}
</tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default StockManagementSection;
