import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import StarRating from './StarRating';
import Price from './Price'; // Assuming Price component handles number formatting
import { ShoppingCart } from 'lucide-react'; // Make sure ShoppingCart is imported for the icon

const ProductCard = ({ product }) => {
    // Get the raw context object first
    const context = useContext(AppContext);

    // --- DIAGNOSTIC LOGS START ---
    console.log("ProductCard rendering. Raw context object:", context);
    // --- DIAGNOSTIC LOGS END ---

    // Defensive checks for each context value
    // Ensure 't' is a function, otherwise provide a fallback
    const t = typeof context?.t === 'function' ? context.t : (key) => key;
    const navigate = context?.navigate || (() => {});
    const addToCart = context?.addToCart || (() => {});
    const currentUser = context?.currentUser || null; // Use currentUser as defined in AppContext
    const showNotification = typeof context?.showNotification === 'function' ? context.showNotification : (() => {});


    // Diagnostic logs: Check what 't' is inside ProductCard after the defensive check
    console.log("ProductCard rendering. Type of t from context (after defensive check):", typeof t);
    console.log("ProductCard rendering. t value from context (after defensive check):", t);

    const [showLoginPopup, setShowLoginPopup] = useState(false); // State to control login popup visibility

    // --- DIAGNOSTIC LOG: Check quantity received by ProductCard ---
    console.log(`[ProductCard Render] Product ID: ${product?.id}, Name: ${product?.name}, Quantity Received: ${product?.quantity}, Is Quantity > 0? ${product?.quantity > 0}`);
    // --- END DIAGNOSTIC LOG ---

    if (!product) {
        return null; // Or a placeholder if no product is provided
    }

    const currentPrice = parseFloat(product.price);
    const originalPrice = parseFloat(product.originalPrice);

    const discountPercentage = (originalPrice > 0 && currentPrice < originalPrice)
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0;

    const handleBuyNow = (e) => {
        e.stopPropagation(); // Prevent card navigation
        if (!currentUser) { // Check if currentUser is not logged in
            setShowLoginPopup(true); // Show the custom login popup
            return; // Stop further execution
        }
        // Only allow buying if in stock
        if (product.quantity > 0) {
            addToCart(product);
            navigate('checkout'); // Navigate to checkout after adding
        } else {
            // Optional: Show a notification if Buy Now is clicked for out-of-stock product (though button will be hidden)
            showNotification(t('productOutOfStock'), 'warning'); // Using showNotification
        }
    };

    const handleAddToCart = (e) => {
        e.stopPropagation(); // Prevent card navigation
        // Only allow adding to cart if in stock
        if (product.quantity > 0) {
            addToCart(product);
        } else {
            // Optional: Show a notification
            showNotification(t('productOutOfStock'), 'warning'); // Using showNotification
        }
    };

    return (
        <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 group cursor-pointer border border-gray-200">
            {/* Product Image Section */}
            <div className="w-full h-48 overflow-hidden relative" onClick={() => navigate('productDetail', product)}>
                <img
                    src={product.images && product.images.length > 0 && product.images[0] ? product.images[0] : 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';
                    }}
                />
                {/* Discount Badge */}
                {discountPercentage > 0 && (
                    <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        {discountPercentage}% Off
                    </span>
                )}
            </div>

            {/* Product Details Section */}
            <div className="p-4 flex flex-col">
                {/* Product Name */}
                <h3
                    className="text-base font-semibold text-gray-800 mb-1 truncate"
                    onClick={() => navigate('productDetail', product)}
                >
                    {product.name}
                </h3>

                {/* Star Rating and Reviews */}
                {/* Ensure product.rating and product.reviews exist or handle gracefully */}
                <div className="flex items-center mb-2">
                    <StarRating rating={product.rating || 0} /> {/* Default to 0 if rating is undefined */}
                    {(product.reviews || 0) > 0 && ( // Ensure reviews is a number
                        <span className="text-xs text-gray-500 ml-1">({product.reviews})</span>
                    )}
                </div>

                {/* Price Information */}
                <div className="flex items-center mb-3">
                    <Price amount={currentPrice} className="text-lg font-bold text-black-900 mr-2" />

                    {(originalPrice > 0 && currentPrice < originalPrice) && (
                        <>
                            <Price amount={originalPrice} className="text-sm text-gray-900 line-through mr-1" />
                            <span className="text-sm text-green-600 font-semibold">
                                {discountPercentage}% off
                            </span>
                        </>
                    )}
                </div>

                {/* Delivery Info */}
                <p className="text-xs text-gray-600 mb-3">
                    <span className="font-semibold text-green-700">Free delivery</span>
                </p>

                {/* --- Stock/Action Buttons Logic (RE-APPLIED) --- */}
                <div className="flex space-x-2 mt-2">
                    {product.quantity > 0 ? (
                        <>
                            <button
                                onClick={handleAddToCart}
                                className="flex-1 py-2 bg-blue-600 text-white text-base font-semibold rounded-md hover:bg-blue-700 transition-colors duration-200 shadow-md"
                            >
                                {t('Add to Cart')} {/* Using t for translation */}
                            </button>
                            <button
                                onClick={handleBuyNow}
                                className="flex-1 py-2 bg-orange-500 text-white text-base font-semibold rounded-md hover:bg-orange-600 transition-colors duration-200 shadow-md"
                            >
                                {t('Buy Now')} {/* Using t for translation */}
                            </button>
                        </>
                    ) : (
                        <div className="w-full py-2 bg-red-100 text-red-700 rounded-md text-center text-base font-semibold flex items-center justify-center cursor-not-allowed">
                            {t('Out Of Stock')} {/* Using t for translation */}
                        </div>
                    )}
                </div>
                {/* --- End Stock/Action Buttons Logic --- */}
            </div>

            {/* Custom Login Popup */}
            {showLoginPopup && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('Login Required')}</h3> {/* Using t */}
                        <p className="text-gray-600 mb-6">{t('Please Login First To Buy Our Product')}</p> {/* Using t */}
                        <button
                            onClick={() => {
                                setShowLoginPopup(false); // Close the popup
                                navigate('login'); // Navigate to the login page
                            }}
                            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
                        >
                            {t('Login')} {/* Using t */}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCard;
