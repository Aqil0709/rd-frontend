import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Package, Calendar, DollarSign, Truck, CheckCircle, XCircle, Clock, Search, Filter, Star } from 'lucide-react';

const OrderPage = () => {
    const { orders, isLoadingOrders, errorOrders, fetchMyOrders, navigate, t } = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        fetchMyOrders();
    }, [fetchMyOrders]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered': return 'text-green-600 bg-green-100';
            case 'Shipped': return 'text-blue-600 bg-blue-100';
            case 'Processing': return 'text-yellow-600 bg-yellow-100';
            case 'Cancelled': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Delivered': return <CheckCircle className="h-4 w-4 mr-1" />;
            case 'Shipped': return <Truck className="h-4 w-4 mr-1" />;
            case 'Processing': return <Clock className="h-4 w-4 mr-1" />;
            case 'Cancelled': return <XCircle className="h-4 w-4 mr-1" />;
            default: return <Package className="h-4 w-4 mr-1" />;
        }
    };

    const filteredOrders = orders.filter(order => {
        // --- FIX: Add defensive checks for order and its properties ---
        if (!order || !order._id) return false;

        // --- FIX: Parse items_details from a string to an array ---
        const items = JSON.parse(order.items_details || '[]');
        
        const orderIdString = String(order._id);
        const matchesSearch = orderIdString.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (Array.isArray(items) && items.some(item =>
                                  item.productName && item.productName.toLowerCase().includes(searchTerm.toLowerCase())
                              ));
        
        const matchesStatus = filterStatus === 'All' || (order.status && order.status.trim().toLowerCase() === filterStatus.toLowerCase());
        
        return matchesSearch && matchesStatus;
    });

    if (isLoadingOrders) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-lg text-gray-700">{t('loadingOrders')}</p>
                </div>
            </div>
        );
    }

    if (errorOrders) {
        return (
            <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12">
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('errorLoadingOrders')}</h2>
                <p className="text-gray-600 mb-8">{errorOrders}</p>
                <button onClick={fetchMyOrders} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('tryAgain')}</button>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
                <img
                    src="https://rukminim1.flixcart.com/www/800/800/promos/16/05/2019/d438a32e-765a-4d8b-b4a6-520b560971e8.png"
                    alt="No Orders"
                    className="mx-auto mb-6 w-48 h-48 object-contain"
                />
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('No Orders')}</h2>
                <p className="text-gray-600 mb-8">{t('No Orders yet')}</p>
                <button onClick={() => navigate('products')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('startShopping')}</button>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-screen py-8 md:py-12 font-inter">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('myOrders')}</h1>

                <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder={t('searchOrdersPlaceholder')}
                            className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    </div>
                    <select
                        className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="All">{t('All Statuses')}</option>
                        <option value="Processing">{t('Processing')}</option>
                        <option value="Shipped">{t('Shipped')}</option>
                        <option value="Delivered">{t('Delivered')}</option>
                        <option value="Cancelled">{t('Cancelled')}</option>
                    </select>
                </div>

                <div className="space-y-6">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => {
                            // --- FIX: Parse items_details here to use in the component ---
                            const items = JSON.parse(order.items_details || '[]');
                            return (
                                <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-gray-200 bg-gray-50">
                                        <div className="mb-2 sm:mb-0">
                                            {/* --- FIX: Use correct property names --- */}
                                            <p className="text-sm text-gray-600">
                                                {t('orderId')}: <span className="font-semibold text-gray-800">#{order._id.slice(-6)}</span>
                                            </p>
                                            <p className="text-sm text-gray-600 flex items-center mt-1">
                                                <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                                                {t('orderDate')}: <span className="font-semibold text-gray-800 ml-1">
                                                    {new Date(order.order_date).toLocaleDateString('en-IN', {
                                                        year: 'numeric', month: 'short', day: 'numeric'
                                                    })}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="flex items-center mt-2 sm:mt-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)} {t(order.status.toLowerCase())}
                                            </span>
                                            <p className="text-lg font-bold text-gray-900 ml-4 flex items-center">
                                                <DollarSign className="h-5 w-5 mr-1 text-green-700" />
                                                {t('total')}: ₹{Number(order.total_amount).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        {items.slice(0, 3).map(item => (
                                            <div key={item.productId} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                                                <img
                                                    src={item.image || `https://placehold.co/80x80/cccccc/ffffff?text=${item.productName ? item.productName.substring(0, 5) : 'Img'}`}
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
                                        {items.length > 3 && (
                                            <div className="text-center pt-4">
                                                <button
                                                    onClick={() => navigate('orderDetail', order)}
                                                    className="text-blue-600 font-semibold hover:underline"
                                                >
                                                    {t('viewAllItems', { count: items.length })}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end items-center space-x-4">
                                        {order.status === 'Delivered' && order.payment_status === 'Paid' && (
                                            <button
                                                onClick={() => navigate('productReview', { product: items[0] })}
                                                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold shadow-sm flex items-center"
                                            >
                                                <Star className="h-4 w-4 mr-2" />
                                                {t('shareYourReview')}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate('orderDetail', order)}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold shadow-sm"
                                        >
                                            {t('View Details')}
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                            <p className="text-lg text-gray-600">{t('noMatchingOrders')}</p>
                            <p className="text-md text-gray-500 mt-2">{t('tryAdjustingFilters')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
