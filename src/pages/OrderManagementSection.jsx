import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';

// A new Row component to manage its own state for updates
const OrderRow = ({ order, t }) => {
    // Get the update function from the context
    const { updateOrderStatus, showNotification, fetchOrders } = useContext(AppContext);
    
    // --- FINAL FIX: Trim whitespace from the initial status ---
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
            // Call the update function from the context
            await updateOrderStatus(order.id, selectedStatus);
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

    return (
        <tr key={order.id} className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.id}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.customerName || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">₹{parseFloat(order.totalAmount).toLocaleString('en-IN')}</td>
            <td className="px-6 py-4 whitespace-nowrap">
                {/* Status is now an editable dropdown */}
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
                    order.paymentStatus === 'Paid' || order.paymentStatus === 'Succesfull' ? 'bg-green-100 text-green-800' :
                    order.paymentStatus === 'Pending' || (typeof order.paymentStatus === 'string' && order.paymentStatus.includes('COD')) ? 'bg-yellow-100 text-yellow-800' : // Adjusted for COD
                    'bg-red-100 text-red-800'
                }`}>
                    {order.paymentStatus}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {new Date(order.orderDate).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {order.items && Array.isArray(order.items) ? (
                    order.items.map((item, index) => (
                        <div key={index}>{item.productName} (x{item.quantity})</div>
                    ))
                ) : 'N/A'}
            </td>
            {/* New "Actions" column */}
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
    // State for payment type filter
    const [paymentTypeFilter, setPaymentTypeFilter] = useState('All'); // 'All', 'UPI', 'COD'
    // State for order status filter
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Filter orders based on selected payment type and status
    const filteredOrders = orders.filter(order => {
        // --- FIX: Add a defensive check to ensure order and its properties exist before filtering ---
        if (!order) return false;

        // Payment type filter logic
        const matchesPaymentType = () => {
            if (paymentTypeFilter === 'All') return true;
            // Ensure paymentStatus is a string before calling .includes()
            const paymentStatus = order.paymentStatus || '';
            if (paymentTypeFilter === 'UPI') {
                return !paymentStatus.includes('COD');
            }
            if (paymentTypeFilter === 'COD') {
                return paymentStatus.includes('COD');
            }
            return true;
        };

        // Status filter logic
        const matchesStatus = () => {
            if (statusFilter === 'All') return true;
            // Ensure status is a string before calling .trim()
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
                        <option value="UPI">{t('UPI')}</option>
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
                                {/* Added Actions header */}
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map(order => (
                                // Render the new OrderRow component for each order
                                <OrderRow key={order.id} order={order} t={t} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default OrderManagementSection;
