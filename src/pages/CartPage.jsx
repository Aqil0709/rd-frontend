import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
// Only import the icons that are actually used to avoid ESLint warnings
import { Trash2, Plus, Minus } from 'lucide-react';

const CartPage = () => {
  const { cart, navigate, updateQuantity, removeFromCart, currentUser, t } = useContext(AppContext);

  // Calculate subtotal based on the selling price (item.price)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Calculate total original price for all items in the cart
  // This is used to determine the total potential savings
  const totalOriginalPrice = cart.reduce((sum, item) => {
    // If originalPrice exists for an item, use it; otherwise, use its selling price
    return sum + (item.originalPrice || item.price) * item.quantity;
  }, 0);

  // --- FIX: Delivery charges removed ---
  const shipping = 0; // Shipping is now always free
  const total = subtotal; // Total is now just the subtotal

  // Calculate total discount by subtracting the subtotal from the total original price
  const totalDiscount = totalOriginalPrice - subtotal;

  const handleCheckout = () => {
    navigate('checkout');
  };

  // --- Start of Modified Logic for Empty Cart/Not Logged In ---
  if (cart.length === 0) {
    if (!currentUser) {
      // User is NOT logged in and cart is empty
      return (
        <div className="container mx-auto px-4 py-16 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
          <img
            src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png" // Placeholder for an empty orders image
            alt="Missing Items"
            className="mx-auto mb-6 w-48 h-48 object-contain"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('Missing Cart Items?') || 'Missing Cart Items?'}</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('Login to see the items you added previously') || 'Login to see the items you added previously'}</p>
          <button
            onClick={() => navigate('login')} // Navigate to login page
            className="bg-orange-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-orange-700 transition-colors transform hover:scale-105 shadow-lg"
          >
            {t('Login') || 'Login'}
          </button>
        </div>
      );
    } else {
      // User IS logged in but cart is empty
      return (
        <div className="container mx-auto px-4 py-16 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
          <img
            src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png" // Placeholder for an empty orders image
            alt="No Orders"
            className="mx-auto mb-6 w-48 h-48 object-contain"
          />
          <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('cart empty')}</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('')}</p>
          <button
            onClick={() => navigate('products')} // Changed to products page
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105 shadow-lg"
          >
            {t('Start Shopping')}
          </button>
        </div>
      );
    }
  }
  // --- End of Modified Logic ---

  return (
    <div className="bg-gray-100 min-h-screen py-8 md:py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">{t('shoppingCart')} ({cart.length} {t('items')})</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
            {cart.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center p-4 border-b border-gray-200 last:border-b-0">
                {/* Product Image */}
                <img
                  src={item.images && item.images.length > 0 ? item.images[0] : `https://placehold.co/100x100/cccccc/ffffff?text=${item.name.substring(0, 5)}`}
                  alt={item.name}
                  className="w-24 h-24 object-contain rounded-sm mr-4 flex-shrink-0"
                  onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/100x100/cccccc/ffffff?text=Image+Not+Found'; }}
                />
                <div className="flex-grow text-center sm:text-left mt-4 sm:mt-0">
                  {/* Product Name */}
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.name}</h3>
                  {/* Seller Info (Optional) */}
                  <p className="text-sm text-gray-500 mb-2">{t('seller')}: Aaisaheb Vastram</p>
                  {/* Price */}
                  <div className="flex items-baseline mb-2 justify-center sm:justify-start">
                    <span className="text-xl font-bold text-gray-900 mr-2">₹{Number(item.price).toFixed(2)}</span> {/* Selling Price */}
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-sm text-gray-500 line-through mr-1">₹{Number(item.originalPrice).toFixed(2)}</span> 
                    )}
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-sm text-green-600 font-semibold">
                        {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
                      </span>
                    )}
                  </div>
                  {/* Quantity Controls */}
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4 text-gray-700" />
                    </button>
                    <span className="w-8 text-center font-semibold text-gray-800 border border-gray-300 rounded-sm py-0.5">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>
                </div>
                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="ml-4 p-2 text-red-500 hover:text-red-700 transition-colors mt-4 sm:mt-0"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {/* Action buttons at the bottom of cart items list */}
            <div className="p-4 flex justify-end bg-white border-t border-gray-200">
              <button
                onClick={handleCheckout}
                className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition-colors shadow-md transform hover:scale-105"
              >
                {t('placeOrder')}
              </button>
            </div>
          </div>

          {/* Price Details Section */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">{t('Price Details')}</h3>
            <div className="space-y-3 mb-4 text-gray-700">
              <div className="flex justify-between">
                <span>{t('price')} ({cart.length} {t('items')})</span>
                <span>₹{totalOriginalPrice.toFixed(2)}</span> {/* Display total original price here */}
              </div>
              <div className="flex justify-between">
                <span>{t('discount')}</span> {/* New line for total discount */}
                <span className="text-green-600 font-semibold">- ₹{totalDiscount.toFixed(2)}</span>
              </div>
              {/* --- FIX: Delivery Charges section removed --- */}
            </div>
            <div className="flex justify-between font-bold text-xl text-gray-900 border-t border-dashed pt-4">
              <span>{t('Total Amount')}</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && ( // Only show savings if there's a discount
              <p className="text-green-700 text-sm mt-4 font-semibold">
                {t('You Will Save')} ₹{totalDiscount.toFixed(2)} {t('On This Order')}!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
