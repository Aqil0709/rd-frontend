import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

// A new Row component to manage its own state for updates
const OrderRow = ({ order, t }) => {
    // Get the update function from the context
    const { updateOrderStatus, showNotification, fetchOrders } = useContext(AppContext);
    
    // This ensures that a value like 'Delivered ' from the DB is treated as 'Delivered'.
    const initialStatus = order.status ? order.status.trim() : '';
    const [selectedStatus, setSelectedStatus] = useState(initialStatus);
    
    // State to manage the loading state of the update button for this row
    const [isUpdating, setIsUpdating] = useState(false);

    // Handler to call the API when the update button is clicked
    const handleStatusUpdate = async () => {
        // Prevent API call if the status hasn't changed
        if (selectedStatus === initialStatus) {
            showNotification(t('noStatusChange'), 'info');
            return;
        }
        setIsUpdating(true);
        try {
            // Use the correct ID property: order._id
            await updateOrderStatus(order._id, selectedStatus);
            showNotification(t('statusUpdatedSuccess'), 'success');
            // Re-fetch all orders to ensure the list is up-to-date
            await fetchOrders(); 
        } catch (error) {
            showNotification(error.message || t('statusUpdateFailed'), 'error');
            // Revert dropdown to original status on failure
            setSelectedStatus(initialStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    // --- FIX: Parse the items_details string into an array ---
    const items = JSON.parse(order.items_details || '[]');

    return (
        <tr key={order._id} className="hover:bg-gray-50">
            {/* --- FIX: Use correct property names from the backend model --- */}
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order._id.slice(-6)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.user_id?.name || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{parseFloat(order.total_amount).toLocaleString('en-IN')}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                <select 
                    value={selectedStatus} 
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="p-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.payment_status === 'Paid' ? 'bg-green-100 text-green-800' :
                    order.payment_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {order.payment_status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(order.order_date).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {items && Array.isArray(items) ? (
                    items.map((item, index) => (
                        <div key={index}>{item.productName} (x{item.quantity})</div>
                    ))
                ) : 'N/A'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button 
                    onClick={handleStatusUpdate}
                    disabled={isUpdating || selectedStatus === initialStatus}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isUpdating ? t('updating') : t('updateStatus')}
                </button>
            </td>
        </tr>
    );
};


const OrderManagementSection = () => {
    const { orders, isLoadingOrders, errorOrders, fetchOrders, t } = useContext(AppContext);
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const filteredOrders = orders.filter(order => {
        if (!order) return false;

        // --- FIX: Use correct property name 'payment_method' ---
        const matchesPaymentType = () => {
            if (paymentTypeFilter === 'All') return true;
            const paymentMethod = order.payment_method || '';
            if (paymentTypeFilter === 'UPI') {
                return paymentMethod === 'Razorpay'; // Assuming Razorpay is UPI
            }
            if (paymentTypeFilter === 'COD') {
                return paymentMethod === 'COD';
            }
            return true;
        };

        const matchesStatus = () => {
            if (statusFilter === 'All') return true;
            const currentStatus = order.status || '';
            return currentStatus.trim() === statusFilter;
        };

        return matchesPaymentType() && matchesStatus();
    });

    if (isLoadingOrders) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>{t('loadingOrders')}</p>
            </div>
        );
    }

    if (errorOrders) {
        return (
            <div className="text-center py-8 text-red-600">
                <p>{t('errorLoadingOrders')}: {errorOrders}</p>
                <button onClick={fetchOrders} className="mt-4 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700">
                    {t('tryAgain')}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">{t('Order Management')}</h2>
            
            <div className="mb-4 flex flex-wrap gap-4 items-center">
                {/* Payment Type Filter Dropdown */}
                <div className="flex items-center">
                    <label htmlFor="paymentTypeFilter" className="mr-2 text-gray-700">{t('Filter by Payment Type')}:</label>
                    <select
                        id="paymentTypeFilter"
                        value={paymentTypeFilter}
                        onChange={(e) => setPaymentTypeFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="All">{t('All')}</option>
                        <option value="UPI">{t('Online')}</option> {/* Changed to Online for clarity */}
                        <option value="COD">{t('COD')}</option>
                    </select>
                </div>

                {/* Order Status Filter Dropdown */}
                <div className="flex items-center">
                    <label htmlFor="statusFilter" className="mr-2 text-gray-700">{t('Filter by Status')}:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="All">{t('All')}</option>
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                    <p>{t('noOrdersFound')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('orderId')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('customer')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('totalAmount')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('status')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('paymentStatus')}</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('orderDate')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('items')}</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map(order => (
                                // --- FIX: Use order._id for the key ---
                                <OrderRow key={order._id} order={order} t={t} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderManagementSection;
