import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Package, Calendar, IndianRupee, Truck, CheckCircle, XCircle, Clock, MapPin, Loader, AlertTriangle } from 'lucide-react';

const OrderDetailPage = () => {
    // 1. Add 'cancelOrder' and 'showNotification' from context
    const { navigate, t, currentUser, fetchOrderById, selectedProduct, cancelOrder, showNotification } = useContext(AppContext);
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // 2. Add state for cancellation logic
    const [isCancellable, setIsCancellable] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const loadOrder = async () => {
            setIsLoading(true);
            setError(null);

            const initialOrderData = selectedProduct;
            const orderId = initialOrderData?.id;

            if (!orderId) {
                setError(t('orderIdMissing'));
                setIsLoading(false);
                return;
            }

            if (!currentUser || !currentUser.id) {
                setError(t('pleaseLoginToViewOrder'));
                setIsLoading(false);
                return;
            }

            try {
                const fetchedOrder = await fetchOrderById(orderId);
                if (fetchedOrder) {
                    
                    // --- 3. Logic to determine if order is cancellable ---
                    const orderDate = new Date(fetchedOrder.orderDate);
                    const now = new Date();
                    const hoursDifference = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

                    if (hoursDifference < 4 && fetchedOrder.status !== 'Cancelled' && fetchedOrder.status !== 'Delivered') {
                        setIsCancellable(true);
                    } else {
                        setIsCancellable(false);
                    }
                    // --- End of cancellability logic ---

                    // Ensure the order date is correctly parsed for display
                    if (fetchedOrder.orderDate) {
                        fetchedOrder.displayDate = new Date(fetchedOrder.orderDate).toLocaleString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        });
                    }

                    if (fetchedOrder.itemsDetails && typeof fetchedOrder.itemsDetails === 'string') {
                        try {
                            fetchedOrder.items = JSON.parse(fetchedOrder.itemsDetails);
                        } catch (e) {
                            console.error("Error parsing itemsDetails in OrderDetailPage:", e);
                            fetchedOrder.items = [];
                        }
                    } else if (!fetchedOrder.items) {
                        fetchedOrder.items = [];
                    }

                    if (!fetchedOrder.shippingDetails && fetchedOrder.shippingName) {
                        fetchedOrder.shippingDetails = {
                            name: fetchedOrder.shippingName,
                            mobile: fetchedOrder.shippingMobile,
                            pincode: fetchedOrder.shippingPincode,
                            locality: fetchedOrder.shippingLocality,
                            address: fetchedOrder.shippingAddress,
                            city: fetchedOrder.shippingCity,
                            state: fetchedOrder.shippingState,
                            address_type: fetchedOrder.shippingAddressType
                        };
                    }

                    setOrder(fetchedOrder);
                } else {
                    setError(t('orderNotFound'));
                }
            } catch (err) {
                console.error("Error loading order details:", err);
                setError(err.message || t('failedToLoadOrderDetails'));
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [selectedProduct, currentUser, fetchOrderById, t]);

    
    // 4. Handler function for the cancel button
    const handleCancelOrder = async () => {
        // A confirmation modal is highly recommended here in a real app
        // to prevent accidental cancellations.
        
        setIsCancelling(true);
        try {
            await cancelOrder(order.id);
            showNotification(t('orderCancelledSuccessfully'), 'success');
            // Refresh order details to show the new "Cancelled" status
            const updatedOrder = await fetchOrderById(order.id);
            setOrder(updatedOrder);
            setIsCancellable(false); // The order is no longer cancellable
        } catch (err) {
            console.error("Error cancelling order:", err);
            showNotification(err.message || t('failedToCancelOrder'), 'error');
        } finally {
            setIsCancelling(false);
        }
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'text-green-600 bg-green-100';
            case 'Shipped': return 'text-blue-600 bg-blue-100';
            case 'Processing': return 'text-yellow-600 bg-yellow-100';
            case 'Cancelled': return 'text-red-600 bg-red-100';
            case 'Pending (COD)': return 'text-purple-600 bg-purple-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered': return <CheckCircle className="h-5 w-5 mr-2" />;
            case 'Shipped': return <Truck className="h-5 w-5 mr-2" />;
            case 'Processing': return <Clock className="h-5 w-5 mr-2" />;
            case 'Cancelled': return <XCircle className="h-5 w-5 mr-2" />;
            case 'Pending (COD)': return <Clock className="h-5 w-5 mr-2" />;
            default: return <Package className="h-5 w-5 mr-2" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-700">{t('loadingOrderDetails')}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('error')}</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <button onClick={() => navigate('myOrders')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('backToOrders')}</button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('orderNotFound')}</h2>
                <p className="text-gray-600 mb-8">{t('orderNotFoundMessage')}</p>
                <button onClick={() => navigate('myOrders')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('backToOrders')}</button>
            </div>
        );
    }

    const itemsSubtotal = order.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
    const totalDiscount = order.items.reduce((sum, item) => sum + (Number(item.originalPrice || item.price) - Number(item.price)) * item.quantity, 0);

    return (
        <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('orderDetails')}</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Order Summary & Items */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Order Header */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">
                                    {t('Order Id')}: <span className="text-blue-700">{order.id}</span>
                                </h2>
                                <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)} {t(order.status.toLowerCase())}
                                </span>
                            </div>
                            <p className="text-gray-600 flex items-center mb-2">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                {t('orderDate')}: {order.displayDate}
                            </p>
                            <p className="text-gray-600 flex items-center">
                                <IndianRupee className="h-4 w-4 mr-2 text-gray-500" />
                                {t('paymentMethod')}: {order.paymentMethod || 'N/A'}
                            </p>
                        </div>

                        {/* Ordered Items */}
                        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('Items In Your Order')}</h3>
                            <div className="space-y-4">
                                {order.items && order.items.map(item => (
                                    <div key={item.productId} className="flex items-center pb-4 border-b border-gray-100 last:border-b-0">
                                        <img
                                            src={item.image || `https://placehold.co/80x80/cccccc/ffffff?text=${item.productName ? item.productName.substring(0, 5) : 'Item'}`}
                                            alt={item.productName}
                                            className="w-20 h-20 object-contain rounded-md mr-4"
                                            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/80x80/cccccc/ffffff?text=Image+Not+Found'; }}
                                        />
                                        <div className="flex-grow">
                                            <p className="text-base font-semibold text-gray-800">{item.productName}</p>
                                            <p className="text-sm text-gray-600">{t('quantity')}: {item.quantity}</p>
                                            <p className="text-sm font-bold text-gray-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <button
                                            onClick={() => navigate('productDetail', { id: item.productId })}
                                            className="text-blue-600 hover:underline text-sm font-medium ml-auto px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
                                        >
                                            {t('viewProduct')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Delivery Address & Price Details */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Delivery Address */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                                <MapPin className="h-5 w-5 mr-2 text-blue-600" /> {t('Delivery Address')}
                            </h3>
                            {order.shippingDetails ? (
                                <div className="text-gray-700">
                                    <p className="font-semibold">{order.shippingDetails.name}</p>
                                    <p>{order.shippingDetails.address}, {order.shippingDetails.locality}</p>
                                    <p>{order.shippingDetails.city}, {order.shippingDetails.state} - {order.shippingDetails.pincode}</p>
                                    <p>{t('mobile')}: {order.shippingDetails.mobile}</p>
                                </div>
                            ) : (
                                <p className="text-gray-500">{t('addressNotAvailable')}</p>
                            )}
                        </div>

                        {/* Price Details */}
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">{t('Price Details')}</h3>
                            <div className="space-y-3 mb-4 text-gray-700">
                                <div className="flex justify-between">
                                    <span>{t('price')} ({order.items.length} {t('items')})</span>
                                    <span>₹{itemsSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('Delivery Charges')}</span>
                                    <span className="text-green-600 font-semibold">{t('free')}</span>
                                </div>
                                {totalDiscount > 0 && (
                                    <div className="flex justify-between text-green-600 font-semibold">
                                        <span>{t('totalDiscount')}</span>
                                        <span>- ₹{totalDiscount.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between font-bold text-xl text-gray-900 border-t border-dashed pt-4">
                                <span>{t('Total Amount')}</span>
                                <span>₹{Number(order.totalAmount).toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 5. Cancel Order Button */}
                        {isCancellable && (
                            <div className="bg-white p-6 rounded-lg shadow-md border border-red-200">
                                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2" /> {t('cancelOrder')}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4">{t('cancelOrderInfo')}</p>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={isCancelling}
                                    className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isCancelling ? (
                                        <>
                                            <Loader className="animate-spin h-5 w-5 mr-2" />
                                            {t('cancelling')}
                                        </>
                                    ) : (
                                        t('cancelOrder')
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailPage;
