import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Heart, Frown } from 'lucide-react'; // Added Frown icon for empty state

const WishlistPage = () => {
  const { wishlist, navigate, t, fetchWishlist } = useContext(AppContext); // Assuming wishlist is an array of product objects or IDs

  useEffect(() => {
    // In a real app, you'd fetch the user's wishlist from the backend here
    // For now, we'll assume `wishlist` in context is populated or needs fetching.
    // If your AppContext has a fetchWishlist function, call it:
    // fetchWishlist();
  }, [fetchWishlist]); // Add fetchWishlist to dependencies if it's a stable function

  if (!wishlist || wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
        <Frown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('emptyWishlistTitle')}</h2>
        <p className="text-gray-600 mb-8">{t('emptyWishlistSubtitle')}</p>
        <button onClick={() => navigate('products')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('startShopping')}</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
          <Heart className="h-7 w-7 mr-3 text-red-500" /> {t('myWishlist')} ({wishlist.length} {t('items')})
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
