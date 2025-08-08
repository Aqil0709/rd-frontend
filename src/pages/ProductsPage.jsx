// src/pages/ProductsPage.jsx
import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard'; // Ensure this path is correct
import FilterModal from '../components/FilterModal'; // Ensure this path is correct
import { SlidersHorizontal, ArrowDownWideNarrow, Loader, XCircle, Trash2, Filter } from 'lucide-react';

const ProductsPage = () => {
    // Destructure necessary values from AppContext
    const { products, searchTerm, t, isLoading, error, fetchProducts } = useContext(AppContext);

    // State for filter and sort options
    const [sortOption, setSortOption] = useState('popularity');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [availabilityFilter, setAvailabilityFilter] = useState('all');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Ref for debouncing price input
    const debounceTimeoutRef = useRef(null);

    // Effect to fetch products when the component mounts or fetchProducts dependency changes
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]); // useCallback ensures fetchProducts reference stability, preventing infinite loop

    // Handler for price range input changes with debouncing
    const handlePriceChange = (e) => {
        const { name, value } = e.target;
        setPriceRange(prev => ({ ...prev, [name]: value }));

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            // The state update (setPriceRange) itself will trigger re-renders and thus re-evaluation of useMemo
        }, 500); // Debounce time: 500ms
    };

    // Function to clear all active filters
    const clearFilters = () => {
        setPriceRange({ min: '', max: '' });
        setAvailabilityFilter('all');
        // Sort option is intentionally kept as-is, mimicking typical e-commerce filter reset behavior.
        // If you wish to reset sorting as well, uncomment: setSortOption('popularity');
    };

    // Callback function to apply filters and sorting logic
    const applyFiltersAndSort = useCallback(() => {
        let filtered = products.filter(product => {
            // 1. Search filter: Checks product name and description against searchTerm
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));

            // 2. Price range filter: Checks if product price falls within min/max range
            const productPrice = parseFloat(product.price);
            const minPrice = parseFloat(priceRange.min);
            const maxPrice = parseFloat(priceRange.max);

            const matchesPrice = (isNaN(minPrice) || productPrice >= minPrice) &&
                                 (isNaN(maxPrice) || productPrice <= maxPrice);

            // 3. Availability filter: Checks product quantity for 'inStock'/'outOfStock'
            // --- FIX: Changed product.stock to product.quantity ---
            const matchesAvailability = availabilityFilter === 'all' ||
                                        (availabilityFilter === 'inStock' && product.quantity > 0) ||
                                        (availabilityFilter === 'outOfStock' && product.quantity === 0);

            return matchesSearch && matchesPrice && matchesAvailability;
        });

        let sorted = [...filtered]; // Create a shallow copy to prevent direct mutation

        // Apply sorting based on the selected option
        switch (sortOption) {
            case 'priceLowToHigh':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'priceHighToLow':
                sorted.sort((a, b) => b.price - a.price);
                break;
            case 'newest':
                // --- FIX: Changed product.createdAt to product.created_at ---
                // Assumes 'created_at' is the property returned from your database for creation date
                sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                break;
            case 'popularity':
            default:
                // Default sorting (e.g., by initial order or popularity if applicable)
                // Example: sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                break;
        }
        return sorted;
    }, [products, searchTerm, priceRange, availabilityFilter, sortOption]); // Dependencies that trigger re-calculation

    // Memoize the filtered and sorted products for performance optimization
    const displayedProducts = useMemo(() => applyFiltersAndSort(), [applyFiltersAndSort]);

    // UI for Loading State
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-700">{t('loadingProducts')}</p>
                </div>
            </div>
        );
    }

    // UI for Error State
    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('errorLoadingProducts')}</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <button onClick={fetchProducts} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70">{t('tryAgain')}</button>
            </div>
        );
    }

    // Determine if any filters are active to conditionally show the "Clear Filters" button
    const areFiltersActive = priceRange.min !== '' || priceRange.max !== '' || availabilityFilter !== 'all';

    return (
        <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('allProducts')}</h1>

                {/* Mobile Filter & Sort Buttons (visible on small screens, hidden on large) */}
                <div className="lg:hidden flex justify-around items-center bg-white border-t border-b border-gray-200 py-3 mb-6 shadow-sm sticky top-0 z-10">
                    <button
                        onClick={() => setIsFilterModalOpen(true)}
                        className="flex items-center text-blue-600 font-semibold px-4 py-2 rounded-md hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label={t('openFilters')}
                    >
                        <Filter className="h-5 w-5 mr-2" /> {t('filters')}
                    </button>
                    <div className="h-6 w-px bg-gray-300"></div> {/* Separator */}
                    <div className="flex items-center text-gray-700">
                        <ArrowDownWideNarrow className="h-5 w-5 mr-2 text-gray-600" />
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="appearance-none bg-transparent border-none text-blue-600 font-semibold focus:outline-none focus:ring-0 cursor-pointer"
                            aria-label={t('selectSortOption')}
                        >
                            <option value="popularity">{t('popularity')}</option>
                            <option value="priceLowToHigh">{t('priceLowToHigh')}</option>
                            <option value="priceHighToLow">{t('priceHighToLow')}</option>
                            <option value="newest">{t('newest')}</option>
                        </select>
                    </div>
                </div>

                {/* Main Content Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Left Sidebar: Filters (hidden on small screens, shown on large) */}
                    <aside className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24 border border-gray-200 hidden lg:block">
                        <h3 className="text-xl font-bold text-gray-800 mb-5 flex items-center border-b pb-3">
                            <SlidersHorizontal className="h-5 w-5 mr-2 text-blue-600" /> {t('filters')}
                        </h3>

                        {/* Price Range Filter controls */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3">{t('price')}</h4>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="number"
                                    name="min"
                                    placeholder={t('minPrice')}
                                    value={priceRange.min}
                                    onChange={handlePriceChange}
                                    className="w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                    aria-label={t('minPrice')}
                                />
                                <span className="text-gray-600">-</span>
                                <input
                                    type="number"
                                    name="max"
                                    placeholder={t('maxPrice')}
                                    value={priceRange.max}
                                    onChange={handlePriceChange}
                                    className="w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                    aria-label={t('maxPrice')}
                                />
                            </div>
                        </div>

                        {/* Availability Filter controls */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold text-gray-700 mb-3">{t('availability')}</h4>
                            <div className="space-y-2">
                                <label className="flex items-center text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="availability"
                                        value="all"
                                        checked={availabilityFilter === 'all'}
                                        onChange={() => setAvailabilityFilter('all')}
                                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2">{t('allProducts')}</span>
                                </label>
                                <label className="flex items-center text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="availability"
                                        value="inStock"
                                        checked={availabilityFilter === 'inStock'}
                                        onChange={() => setAvailabilityFilter('inStock')}
                                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2">{t('inStockOnly')}</span>
                                </label>
                                <label className="flex items-center text-gray-700 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="availability"
                                        value="outOfStock"
                                        checked={availabilityFilter === 'outOfStock'}
                                        onChange={() => setAvailabilityFilter('outOfStock')}
                                        className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="ml-2">{t('outOfStock')}</span>
                                </label>
                            </div>
                        </div>

                        {/* Clear Filters Button (desktop) */}
                        {areFiltersActive && (
                            <button
                                onClick={clearFilters}
                                className="w-full mt-6 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200
                                               flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
                                aria-label={t('clearAllFilters')}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> {t('clearFilters')}
                            </button>
                        )}
                    </aside>

                    {/* Right Main Content: Sorting and Product Grid */}
                    <main className="lg:col-span-3">
                        {/* Sorting Options (desktop-only, integrates with mobile buttons) */}
                        <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between border border-gray-200 hidden lg:flex">
                            <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                <ArrowDownWideNarrow className="h-5 w-5 mr-2 text-gray-600" /> {t('sortBy')}:
                            </h3>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                aria-label={t('selectSortOption')}
                            >
                                <option value="popularity">{t('popularity')}</option>
                                <option value="priceLowToHigh">{t('priceLowToHigh')}</option>
                                <option value="priceHighToLow">{t('priceHighToLow')}</option>
                                <option value="newest">{t('newest')}</option>
                            </select>
                        </div>

                        {/* Product Grid Display */}
                        {displayedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {displayedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 text-lg py-12 bg-white rounded-lg shadow-md border border-gray-200">
                                <img
                                    src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png"
                                    alt={t('noProductsFoundAlt')}
                                    className="mx-auto mb-6 w-48 h-48 object-contain"
                                />
                                <p className="text-2xl font-semibold mb-2">{t('noProductsFound')}</p>
                                <p className="text-md">{t('tryAdjustingFiltersOrSearch')}</p>
                            </div>
                        )}
                        {/* Pagination Placeholder would go here */}
                    </main>
                </div>
            </div>

            {/* Filter Modal (for mobile view, appears when filter button clicked) */}
            <FilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title={t('filters')}>
                {/* Filter content within the modal, similar to desktop sidebar */}
                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">{t('price')}</h4>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                            type="number"
                            name="min"
                            placeholder={t('minPrice')}
                            value={priceRange.min}
                            onChange={handlePriceChange}
                            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            aria-label={t('minPrice')}
                        />
                        <span className="text-gray-600 hidden sm:block">-</span>
                        <input
                            type="number"
                            name="max"
                            placeholder={t('maxPrice')}
                            value={priceRange.max}
                            onChange={handlePriceChange}
                            className="w-full sm:w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                            aria-label={t('maxPrice')}
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-700 mb-3">{t('availability')}</h4>
                    <div className="space-y-2">
                        <label className="flex items-center text-gray-700 cursor-pointer">
                            <input
                                type="radio"
                                name="availability"
                                value="all"
                                checked={availabilityFilter === 'all'}
                                onChange={() => setAvailabilityFilter('all')}
                                className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">{t('allProducts')}</span>
                        </label>
                        <label className="flex items-center text-gray-700 cursor-pointer">
                            <input
                                type="radio"
                                name="availability"
                                value="inStock"
                                checked={availabilityFilter === 'inStock'}
                                onChange={() => setAvailabilityFilter('inStock')}
                                className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">{t('inStockOnly')}</span>
                        </label>
                        <label className="flex items-center text-gray-700 cursor-pointer">
                            <input
                                type="radio"
                                name="availability"
                                value="outOfStock"
                                checked={availabilityFilter === 'outOfStock'}
                                onChange={() => setAvailabilityFilter('outOfStock')}
                                className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2">{t('outOfStock')}</span>
                        </label>
                    </div>
                </div>

                {areFiltersActive && (
                    <button
                        onClick={clearFilters}
                        className="w-full mt-6 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200
                                       flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gray-400"
                        aria-label={t('clearAllFilters')}
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> {t('clearFilters')}
                    </button>
                )}
                {/* Apply button for the modal (closes the modal and applies filters) */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={() => setIsFilterModalOpen(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-70"
                    >
                        {t('apply')}
                    </button>
                </div>
            </FilterModal>
        </div>
    );
};

export default ProductsPage;