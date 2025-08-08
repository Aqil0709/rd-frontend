import React, { useContext, useState, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import StarRating from '../components/StarRating';
import Price from '../components/Price';
import ProductCard from '../components/ProductCard';
import { ShoppingCart, Zap, Truck, ShieldCheck, MapPin, CheckCircle } from 'lucide-react';

const ProductDetailPage = () => {
  const { selectedProduct, addToCart, navigate, t, products } = useContext(AppContext);

  const [mainImage, setMainImage] = useState('');
  // We'll still use selectedVariant to manage the currently displayed "variant" product
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);

  // Helper function to normalize product names for grouping
  // This will remove common color/size descriptors to get a base name
  const getBaseProductName = (productName) => {
    // Example: Remove common color names, size descriptors, etc.
    // You might need to expand this regex based on your naming conventions.
    const normalizedName = productName
      .toLowerCase()
      .replace(/\s(red|blue|green|black|white|yellow|pink|purple|orange|brown|grey|gray)\s?/g, '') // Remove common colors
      .replace(/\s(s|m|l|xl|xxl|small|medium|large|extra large)\s?/g, '') // Remove common sizes
      .replace(/\s(saree|dress|shirt|pants|top)\s?/g, '') // Remove generic product types if they vary
      .trim();
    return normalizedName;
  };

  // Memoize the related "variant" products based on name
  const relatedNameVariants = useMemo(() => {
    if (!selectedProduct || !products || products.length === 0) return [];

    const baseName = getBaseProductName(selectedProduct.name);

    return products.filter(
      (product) =>
        product.id !== selectedProduct.id && // Not the current product itself
        getBaseProductName(product.name) === baseName // Same base name
    );
  }, [selectedProduct, products]);

  // Effect to set initial main image and the currently "selected" product (can be the base or a variant)
  useEffect(() => {
    if (selectedProduct) {
      // Initialize with the current selectedProduct as the primary variant
      setSelectedVariantProduct(selectedProduct);
      if (selectedProduct.images && selectedProduct.images.length > 0) {
        setMainImage(selectedProduct.images[0]);
      } else {
        setMainImage('https://placehold.co/600x600/cccccc/ffffff?text=Image+Not+Found');
      }
    } else {
      setMainImage('https://placehold.co/600x600/cccccc/ffffff?text=Image+Not+Found');
    }
  }, [selectedProduct]);

  // Handle clicking on a "variant" product (which is just another product in your data)
  const handleVariantProductChange = (variantProduct) => {
    setSelectedVariantProduct(variantProduct);
    if (variantProduct.images && variantProduct.images.length > 0) {
      setMainImage(variantProduct.images[0]);
    } else {
      setMainImage('https://placehold.co/600x600/cccccc/ffffff?text=Image+Not+Found');
    }
    // Optionally, you might want to update the URL here to reflect the new product ID
    // navigate(`/product/${variantProduct.id}`);
  };

  if (!selectedProduct) {
    return (
      <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('productNotFound')}</h2>
        <p className="text-gray-600 mb-8">{t('productNotFoundSubtitle')}</p>
        <button onClick={() => navigate('products')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('browseProducts')}</button>
      </div>
    );
  }

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    e.currentTarget.firstChild.style.transformOrigin = `${x}% ${y}%`;
  };

  const handleAddToCartClick = () => {
    // Add the currently selected "variant" product to the cart
    addToCart(selectedVariantProduct);
  };

  const handleBuyNow = () => {
    // Add the currently selected "variant" product to the cart and navigate
    addToCart(selectedVariantProduct);
    navigate('checkout');
  };

  // Calculate discount percentage based on the currently displayed product
  const discountPercentage = selectedVariantProduct && selectedVariantProduct.originalPrice && selectedVariantProduct.originalPrice > selectedVariantProduct.price
    ? Math.round(((selectedVariantProduct.originalPrice - selectedVariantProduct.price) / selectedVariantProduct.originalPrice) * 100)
    : 0;

  // Filter for genuinely related products (same category, different base name)
  const trulyRelatedProducts = products.filter(
    (product) =>
      product.category === selectedProduct.category &&
      getBaseProductName(product.name) !== getBaseProductName(selectedProduct.name) // Different base name
  ).slice(0, 4);

  // Determine which set of images to display for thumbnails
  const currentImagesForThumbnails = selectedVariantProduct?.images || [];

  return (
    <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-5 flex flex-col items-center">
            {/* Main Image with Zoom */}
            <div
              className="relative w-full h-[450px] md:h-[550px] border border-gray-200 rounded-lg overflow-hidden group cursor-zoom-in shadow-md"
              onMouseMove={handleMouseMove}
            >
              <img
                src={mainImage}
                alt={selectedVariantProduct?.name || selectedProduct.name}
                className="w-full h-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-150 p-4"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x600/cccccc/ffffff?text=Image+Not+Found'; }}
              />
            </div>

            {/* Thumbnails - Dynamically based on the selected "variant" product */}
            {currentImagesForThumbnails.length > 0 && (
              <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                {currentImagesForThumbnails.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`${selectedVariantProduct?.name || selectedProduct.name} thumbnail ${index + 1}`}
                    className={`w-20 h-20 object-contain border rounded-md cursor-pointer transition-all duration-200 ${mainImage === img ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'}`}
                    onClick={() => setMainImage(img)}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=Img'; }}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex w-full mt-6 space-x-4">
              <button
                onClick={handleAddToCartClick}
                className="flex-1 py-3 bg-orange-500 text-white text-lg font-semibold rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center shadow-md transform hover:scale-105"
              >
                <ShoppingCart className="mr-2 h-6 w-6" /> {t('addToCart')}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center shadow-md transform hover:scale-105"
              >
                <Zap className="mr-2 h-6 w-6" /> {t('Buy Now')}
              </button>
            </div>
          </div>

          {/* Right Column: Product Details */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Product Title and Category */}
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {selectedVariantProduct?.name || selectedProduct.name}
            </h2>
            <p className="text-lg text-gray-600 mb-4">{selectedVariantProduct?.category || selectedProduct.category}</p>

            {/* Rating and Reviews - Use selectedProduct's reviews for the "group" */}
            <div className="flex items-center mb-4">
              <StarRating rating={selectedProduct.rating} />
              {selectedProduct.reviews > 0 && (
                <span className="text-sm text-gray-500 ml-2">({selectedProduct.reviews} {t('reviews')})</span>
              )}
            </div>

            {/* Price Section - Use selectedVariantProduct's price */}
            <div className="mb-6">
              <div className="flex items-baseline mb-2">
                <Price amount={selectedVariantProduct?.price || 0} className="text-3xl font-bold text-gray-900 mr-3" />
                {selectedVariantProduct?.originalPrice && selectedVariantProduct.originalPrice > selectedVariantProduct.price && (
                  <>
                    <span className="text-lg text-gray-500 line-through mr-2">₹{Number(selectedVariantProduct.originalPrice).toFixed(2)}</span>
                    {discountPercentage > 0 && (
                      <span className="text-lg text-green-600 font-semibold">{discountPercentage}% {t('off')}</span>
                    )}
                  </>
                )}
              </div>
              {discountPercentage > 0 && (
                <p className="text-sm text-gray-700">{t('inclusive Of All Taxes')}</p>
              )}
            </div>

            {/* Color/Variant Options based on Name Grouping */}
            {relatedNameVariants.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">{t('availableColors') || 'Available Colors'}:</h3>
                <div className="flex flex-wrap gap-3"> {/* Use flex-wrap for better layout with many items */}
                  {[selectedProduct, ...relatedNameVariants].map((variantProd) => ( // Include the current product as an option
                    <div
                      key={variantProd.id}
                      className={`relative w-20 h-20 rounded-md border-2 cursor-pointer transition-all duration-200
                                ${selectedVariantProduct?.id === variantProd.id ? 'border-blue-600 ring-2 ring-blue-300' : 'border-gray-200 hover:border-blue-300'}`}
                      onClick={() => handleVariantProductChange(variantProd)}
                      title={variantProd.name}
                    >
                      <img
                        src={variantProd.images && variantProd.images.length > 0 ? variantProd.images[0] : 'https://placehold.co/80x80/cccccc/ffffff?text=Color'}
                        alt={variantProd.name}
                        className="w-full h-full object-contain rounded-md p-1"
                      />
                      {selectedVariantProduct?.id === variantProd.id && (
                        <CheckCircle className="absolute -top-2 -right-2 h-6 w-6 text-blue-600 bg-white rounded-full border border-blue-600" />
                      )}
                      {/* Optional: Display a small label for the color/variant name */}
                      <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center rounded-b-md p-0.5">
                        {variantProd.name.replace(getBaseProductName(variantProd.name), '').trim() || 'Default'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Description - Use selectedVariantProduct's description */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t('description')}</h3>
              <p className="text-gray-700 leading-relaxed">{selectedVariantProduct?.description || selectedProduct.description}</p>
            </div>

            {/* Highlights/Specifications (Dummy Data) */}
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">{t('highlights')}</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>{t('fabric')}: Silk Blend</li>
                <li>{t('pattern')}: Woven Design</li>
                <li>{t('occasion')}: Festive, Party, Traditional</li>
                <li>{t('length')}: 5.5m Saree + 0.8m Blouse Piece</li>
              </ul>
            </div>

            {/* Delivery & Services */}
            <div className="mb-6 border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center"><Truck className="h-5 w-5 mr-2 text-blue-600" /> {t('delivery And Services')}</h3>
              
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <ShieldCheck className="h-4 w-4 mr-2 text-purple-600" /> {t('secureTransaction')}
              </p>
            </div>

            {/* Ratings & Reviews Section (Placeholder) */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Ratings And Reviews')}</h3>
              <p className="text-gray-600">{t('')}</p>
              {/* In a real app, you'd integrate a review component here */}
            </div>
          </div>
        </div>

        {/* Related Products Section (now filters out same-name variants) */}
        {trulyRelatedProducts.length > 0 && (
          <div className="mt-12 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('you Might Also Like')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trulyRelatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;