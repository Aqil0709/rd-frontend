import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle, Package, Truck, XCircle } from 'lucide-react';

const OrderConfirmationPage = () => {
    // CORRECTED: Get 'selectedProduct' which holds the order data passed from navigate()
    const { navigate, t, selectedProduct, fetchOrderById } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(true);
    const [displayOrderDetails, setDisplayOrderDetails] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadOrderDetails = async () => {
            // Check if the data passed from the previous page is a summary (has orderId)
            // or the full object (has id).
            const orderId = selectedProduct?.orderId || selectedProduct?.id;

            if (orderId) {
                try {
                    // Fetch the most up-to-date and complete order details
                    const fullOrderDetails = await fetchOrderById(orderId);
                    setDisplayOrderDetails(fullOrderDetails);
                } catch (err) {
                    console.error("Failed to fetch order details:", err);
                    setError(t('orderNotFoundMessage'));
                }
            } else {
                // Handle case where user navigates here directly without order data
                setError(t('orderNotFoundMessage'));
            }
            setIsLoading(false);
        };

        loadOrderDetails();
    }, [selectedProduct, fetchOrderById, t]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl font-bold text-gray-800">Loading Order Confirmation...</h2>
            </div>
        );
    }

    if (error || !displayOrderDetails) {
        return (
            <div className="container mx-auto px-4 py-16 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('orderNotFound')}</h2>
                <p className="text-gray-600 mb-8">{error || t('orderNotFoundMessage')}</p>
                <button onClick={() => navigate('home')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('continueShopping')}</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
            <div className="container mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6 md:p-8 text-center">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6 animate-bounce-in" />
                    <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{t('orderConfirmed')}!</h1>
                    <p className="text-lg text-gray-700 mb-2">{t('thankYouForYourOrder')}</p>
                    <p className="text-md text-gray-600 mb-8">
                        {t('yourOrderIdIs')}: <span className="font-bold text-blue-700">#{displayOrderDetails.id}</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-10">
                        {/* Order Summary Card */}
                        <div className="bg-blue-50 p-6 rounded-lg shadow-inner border border-blue-200">
                            <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2" /> {t('orderSummary')}
                            </h3>
                            <p className="text-gray-700 mb-2">
                                {/* CORRECTED: Use totalAmount from the full order object */}
                                <strong>{t('totalAmount')}:</strong> ₹{Number(displayOrderDetails.totalAmount).toFixed(2)}
                            </p>
                            <p className="text-gray-700 mb-2">
                                <strong>{t('paymentMethod')}:</strong> {displayOrderDetails.paymentMethod || 'Online'}
                            </p>
                            <p className="text-gray-700">
                                {/* CORRECTED: Removed incorrect Unix timestamp conversion */}
                                <strong>{t('orderDate')}:</strong> {new Date(displayOrderDetails.orderDate).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Shipping Address Card */}
                        {displayOrderDetails.shippingDetails && (
                             <div className="bg-green-50 p-6 rounded-lg shadow-inner border border-green-200">
                                <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center">
                                    <Truck className="h-5 w-5 mr-2" /> {t('shippingAddress')}
                                </h3>
                                <p className="text-gray-700">
                                    <strong>{displayOrderDetails.shippingDetails.name}</strong>
                                </p>
                                <p className="text-gray-700">
                                    {displayOrderDetails.shippingDetails.address}, {displayOrderDetails.shippingDetails.locality}
                                </p>
                                <p className="text-gray-700">
                                    {/* CORRECTED: Changed .zip to .pincode */}
                                    {displayOrderDetails.shippingDetails.city}, {displayOrderDetails.shippingDetails.state} - {displayOrderDetails.shippingDetails.pincode}
                                </p>
                                <p className="text-gray-700">
                                    {t('mobile')}: {displayOrderDetails.shippingDetails.mobile}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <button
                            onClick={() => navigate('orderDetail', displayOrderDetails)}
                            className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors transform hover:scale-105 shadow-md"
                        >
                            {t('viewOrderDetails')}
                        </button>
                        <button
                            onClick={() => navigate('products')}
                            className="px-8 py-3 bg-gray-200 text-gray-800 text-lg font-semibold rounded-lg hover:bg-gray-300 transition-colors transform hover:scale-105 shadow-md"
                        >
                            {t('continueShopping')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderConfirmationPage;
