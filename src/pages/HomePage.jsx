import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ProductCard from '../components/ProductCard';
import { Sparkles, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const HomePage = () => {
  // Get the raw context object first
  const context = useContext(AppContext);

  // --- DIAGNOSTIC LOGS START ---
  console.log("HomePage rendering. Raw context object:", context);
  // --- DIAGNOSTIC LOGS END ---

  // Defensive checks for each context value
  const t = typeof context?.t === 'function' ? context.t : (key) => key;
  const navigate = context?.navigate || (() => {});
  const products = context?.products || [];
  const isLoading = context?.isLoading ?? true; // Use nullish coalescing for boolean
  const error = context?.error || null;
  const filteredProducts = context?.filteredProducts || [];
  const currentUser = context?.currentUser || null; // Assuming currentUser is also used here
  const fetchProducts = context?.fetchProducts || (() => {});


  // Diagnostic logs: Check what 't' is inside HomePage after the defensive check
  console.log("HomePage rendering. Type of t from context (after defensive check):", typeof t);
  console.log("HomePage rendering. t value from context (after defensive check):", t);


  // Array of your uploaded saree image paths
  const bannerImages = [
    '/c1.jpg',
    '/c2.jpg',
    '/c3.jpg',
        // Add more saree banner images if available
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Effect to cycle through banner images every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex + 1) % bannerImages.length
      );
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval); // Clean up the interval on component unmount
  }, [bannerImages.length]);

  // Simulate different product sections
  const topDealsProducts = products.slice(0, 8); // First 8 products as top deals

  // Function to scroll horizontally for product sections
  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = 300; // Adjust scroll amount as needed
      if (direction === 'left') {
        ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  // Function to navigate banner carousel with arrows
  const navigateBanner = (direction) => {
    setCurrentImageIndex((prevIndex) => {
      if (direction === 'left') {
        return (prevIndex - 1 + bannerImages.length) % bannerImages.length;
      } else {
        return (prevIndex + 1) % bannerImages.length;
      }
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen">
     

      {/* Top Deals Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-3xl font-bold text-gray-800 flex items-center">
            <Sparkles className="h-7 w-7 text-yellow-500 mr-3" /> {t('Products')}
          </h3>
          <button onClick={() => navigate('products')} className="px-5 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-semibold">
            {t('view All')}
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {topDealsProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* Recommended Products Section */}
     

      {/* Basic Footer Placeholder */}
     
    </div>
  );
};

export default HomePage;
