import React, { useState, useContext, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { Truck, MapPin, CreditCard, ChevronDown, Package, CheckCircle, Loader, Wallet } from 'lucide-react';

const CheckoutPage = () => {
    const { cart, t, currentUser, navigate, placeUpiOrder, addresses, addAddress, showNotification, placeCodOrder, getOrderStatus, cancelOrder, setCart } = useContext(AppContext);

    // --- FIX 1: Changed address_type to addressType ---
    const [newAddressData, setNewAddressData] = useState({
        name: '', mobile: '', pincode: '', locality: '', address: '', city: '', state: '', addressType: 'Home',
    });

    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [deliveryAddress, setDeliveryAddress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressFormErrors, setAddressFormErrors] = useState({});
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
    const [upiPaymentInitiated, setUpiPaymentInitiated] = useState(false);
    const [upiOrderId, setUpiOrderId] = useState(null);
    const [isPollingPayment, setIsPollingPayment] = useState(false);
    const [pollingAttempts, setPollingAttempts] = useState(0);

    const MAX_POLLING_ATTEMPTS = 36;
    const POLLING_INTERVAL_MS = 5000;
    const PAYMENT_TIMEOUT_MS = 180000;

    useEffect(() => {
        if (addresses && addresses.length > 0 && !deliveryAddress) {
            const defaultAddress = addresses[0];
            setSelectedAddressId(defaultAddress.id);
            setDeliveryAddress(defaultAddress);
            setShowAddressForm(false);
            if (cart.length > 0) {
                setActiveStep(2);
            }
        } else if (!addresses || addresses.length === 0) {
            setShowAddressForm(true);
            setSelectedAddressId('new');
        }
    }, [addresses, deliveryAddress, cart.length]);

    useEffect(() => {
        if (currentUser) {
            setNewAddressData(prev => ({ ...prev, name: currentUser.name || '' }));
        }
    }, [currentUser]);

    useEffect(() => {
        let pollingInterval;
        let paymentTimeout;

        if (upiPaymentInitiated && upiOrderId && isPollingPayment) {
            showNotification(t('please Complete Upi Payment', { minutes: (PAYMENT_TIMEOUT_MS / 60000) }), 'info', PAYMENT_TIMEOUT_MS + 5000);

            paymentTimeout = setTimeout(async () => {
                clearInterval(pollingInterval);
                setIsPollingPayment(false);
                setUpiPaymentInitiated(false);
                setUpiOrderId(null);
                setPollingAttempts(0);
                setCart([]);

                try {
                    await cancelOrder(upiOrderId);
                    showNotification(t('upi Payment Timed Out And Cancelled'), 'error');
                } catch (err) {
                    console.error("Error cancelling order after timeout:", err);
                    showNotification(t('failed To Cancel Order After Timeout'), 'error');
                }
            }, PAYMENT_TIMEOUT_MS);

            pollingInterval = setInterval(async () => {
                setPollingAttempts(prev => prev + 1);

                if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
                    clearInterval(pollingInterval);
                    clearTimeout(paymentTimeout);
                    setIsPollingPayment(false);
                    setUpiPaymentInitiated(false);
                    setUpiOrderId(null);
                    setPollingAttempts(0);
                    return;
                }

                try {
                    const statusResponse = await getOrderStatus(upiOrderId);
                    if (statusResponse.status === 'PAID') {
                        clearInterval(pollingInterval);
                        clearTimeout(paymentTimeout);
                        setIsPollingPayment(false);
                        setUpiPaymentInitiated(false);
                        setUpiOrderId(null);
                        setPollingAttempts(0);
                        setCart([]);
                        showNotification(t('upiPaymentSuccess'), 'success');
                        navigate('orderConfirmation', { orderId: upiOrderId, status: 'PAID' });
                    } else if (statusResponse.status === 'FAILED' || statusResponse.status === 'CANCELLED') {
                        clearInterval(pollingInterval);
                        clearTimeout(paymentTimeout);
                        setIsPollingPayment(false);
                        setUpiPaymentInitiated(false);
                        setUpiOrderId(null);
                        setPollingAttempts(0);
                        setCart([]);
                        showNotification(t('upiPaymentFailedOrCancelled'), 'error');
                    }
                } catch (err) {
                    console.error("Error during UPI payment polling:", err);
                }
            }, POLLING_INTERVAL_MS);
        }

        return () => {
            clearInterval(pollingInterval);
            clearTimeout(paymentTimeout);
        };
    }, [upiPaymentInitiated, upiOrderId, isPollingPayment, pollingAttempts, getOrderStatus, cancelOrder, navigate, showNotification, t, setCart]);

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const originalSubtotal = cart.reduce((sum, item) => sum + (item.originalPrice ? Number(item.originalPrice) : Number(item.price)) * Number(item.quantity), 0);
    const total = subtotal;
    const totalDiscount = originalSubtotal - subtotal;
    const YOUR_UPI_VPA = 'BHARATPE2FOD000R8022209@unitype';
    const YOUR_MERCHANT_NAME = 'RD General Store';

    const handleInputChange = (e) => {
        setNewAddressData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setAddressFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handlePlaceOrderCOD = async () => {
        setIsSubmitting(true);
        try {
            const orderResponse = await placeCodOrder(deliveryAddress.id);
            if (orderResponse?.orderId) {
                showNotification(orderResponse.message || t('codOrderPlacedSuccess'), 'success');
                navigate('orderConfirmation', orderResponse);
            } else {
                throw new Error(orderResponse?.message || t('failedToPlaceOrder'));
            }
        } catch (error) {
            showNotification(error.message || t('failedToPlaceOrder'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitPayment = () => {
        if (selectedPaymentMethod === 'upi') {
            handleUpiPay();
        } else if (selectedPaymentMethod === 'cod') {
            handlePlaceOrderCOD();
        }
    };

    const handleAddressSelection = (e) => {
        const selectedId = e.target.value;
        setSelectedAddressId(selectedId);
        if (selectedId === 'new') {
            setShowAddressForm(true);
            setDeliveryAddress(null);
            setActiveStep(1);
        } else {
            setShowAddressForm(false);
            const selectedAddr = addresses.find(addr => String(addr.id) === selectedId);
            setDeliveryAddress(selectedAddr);
            if (selectedAddr) {
                setActiveStep(2);
            }
        }
    };

    const validateAddressForm = () => {
        let errors = {};
        let isValid = true;
        if (!newAddressData.name.trim()) { errors.name = t('nameRequired'); isValid = false; }
        if (!newAddressData.mobile.trim() || !/^\d{10}$/.test(newAddressData.mobile)) { errors.mobile = t('validMobileRequired'); isValid = false; }
        if (!newAddressData.pincode.trim() || !/^\d{6}$/.test(newAddressData.pincode)) { errors.pincode = t('validPincodeRequired'); isValid = false; }
        if (!newAddressData.locality.trim()) { errors.locality = t('localityRequired'); isValid = false; }
        if (!newAddressData.address.trim()) { errors.address = t('addressRequired'); isValid = false; }
        if (!newAddressData.city.trim()) { errors.city = t('cityRequired'); isValid = false; }
        if (!newAddressData.state.trim()) { errors.state = t('stateRequired'); isValid = false; }
        setAddressFormErrors(errors);
        return isValid;
    };

    const handleAddAddressSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setAddressFormErrors({});

        if (!validateAddressForm()) {
            showNotification(t('pleaseCorrectAddressErrors'), 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const newlyAddedAddress = await addAddress(newAddressData);
            if (newlyAddedAddress && newlyAddedAddress.id) {
                setDeliveryAddress(newlyAddedAddress);
                setSelectedAddressId(newlyAddedAddress.id);
                setShowAddressForm(false);
                // --- FIX 2: Changed address_type to addressType ---
                setNewAddressData({ name: currentUser?.name || '', mobile: '', pincode: '', locality: '', address: '', city: '', state: '', addressType: 'Home' });
                setActiveStep(2);
            } else {
                throw new Error(t('failedToAddAddress'));
            }
        } catch (error) {
            showNotification(error.message || t('failedToAddAddress'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalDiscountPercentage = (originalSubtotal > 0 && totalDiscount > 0)
        ? Math.round((totalDiscount / originalSubtotal) * 100)
        : 0;

    const handleUpiPay = async () => {
        if (!deliveryAddress) {
            showNotification(t('pleaseSelectOrAddAddress'), 'error');
            return;
        }
        setIsSubmitting(true);
        const transactionRef = `ORDER_${Date.now()}`;

        try {
            const orderResponse = await placeUpiOrder(deliveryAddress.id, transactionRef);
            if (orderResponse?.orderId) {
                const upiUrl = `upi://pay?pa=${YOUR_UPI_VPA}&pn=${encodeURIComponent(YOUR_MERCHANT_NAME)}&tid=${transactionRef}&tr=${transactionRef}&am=${total.toFixed(2)}&cu=INR`;
                setUpiPaymentInitiated(true);
                setUpiOrderId(orderResponse.orderId);
                setIsPollingPayment(true);
                window.location.href = upiUrl;
            } else {
                throw new Error(orderResponse?.message || t('failedToInitiateOrder'));
            }
        } catch (error) {
            showNotification(error.message || t('failedToInitiateOrder'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0 && !upiPaymentInitiated) {
        return (
            <div className="container mx-auto px-4 py-12 text-center bg-white rounded-lg shadow-lg my-12 max-w-2xl">
                <h2 className="text-3xl font-bold mb-4">{t('cartEmptyTitle')}</h2>
                <p className="text-gray-600 mb-8">{t('cartEmptySubtitle')}</p>
                <button onClick={() => navigate('products')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">{t('startShopping')}</button>
            </div>
        );
    }

    const AddressDisplay = ({ address }) => (
        <div className="p-4 border border-blue-300 bg-blue-50 rounded-lg text-gray-700">
            <p className="font-bold text-gray-800">{address.name}</p>
            <p>{address.address}, {address.locality}</p>
            <p>{address.city}, {address.state} - {address.pincode}</p>
            <p className="font-semibold">{t('mobile')}: {address.mobile}</p>
            {/* --- FIX 3: Changed address.address_type to address.addressType --- */}
            {address.addressType && (
                <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {address.addressType}
                </span>
            )}
        </div>
    );

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('Checkout')}</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button
                                className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800"
                                onClick={() => setActiveStep(1)}
                            >
                                <span className="flex items-center">
                                    {activeStep > 1 && deliveryAddress ? (
                                        <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
                                    ) : (
                                        <MapPin className="mr-3 h-6 w-6 text-blue-600" />
                                    )}
                                    {t('Delivery Address')}
                                </span>
                                <ChevronDown className={`transition-transform ${activeStep === 1 ? 'rotate-180' : ''}`} />
                            </button>
                            {activeStep === 1 && (
                                <div className="p-5 border-t border-gray-200">
                                    {addresses && addresses.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('Selected Address')}</h3>
                                            <select
                                                value={selectedAddressId || ''}
                                                onChange={handleAddressSelection}
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                <option value="" disabled>{t('chooseAnAddress')}</option>
                                                {addresses.map(addr => (
                                                    <option key={addr.id} value={addr.id}>{addr.name}, {addr.address}, {addr.city}</option>
                                                ))}
                                                <option value="new">{t('addNewAddress')}</option>
                                            </select>
                                        </div>
                                    )}

                                    {showAddressForm && (
                                        <form onSubmit={handleAddAddressSubmit} className="space-y-4 mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50">
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">{t('Add Address Details')}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <input type="text" name="name" placeholder={t('fullName')} value={newAddressData.name} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.name && <p className="text-red-500 text-sm mt-1">{addressFormErrors.name}</p>}
                                                </div>
                                                <div>
                                                    <input type="tel" name="mobile" placeholder={t('mobileNumber')} value={newAddressData.mobile} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.mobile && <p className="text-red-500 text-sm mt-1">{addressFormErrors.mobile}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="pincode" placeholder={t('pincode')} value={newAddressData.pincode} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.pincode && <p className="text-red-500 text-sm mt-1">{addressFormErrors.pincode}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="locality" placeholder={t('locality')} value={newAddressData.locality} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.locality ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.locality && <p className="text-red-500 text-sm mt-1">{addressFormErrors.locality}</p>}
                                                </div>
                                            </div>
                                            <textarea name="address" placeholder={t('addressArea')} value={newAddressData.address} onChange={handleInputChange} className={`w-full p-3 border ${addressFormErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-blue-500 focus:border-blue-500`} rows="3" required></textarea>
                                            {addressFormErrors.address && <p className="text-red-500 text-sm mt-1">{addressFormErrors.address}</p>}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <input type="text" name="city" placeholder={t('city')} value={newAddressData.city} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.city && <p className="text-red-500 text-sm mt-1">{addressFormErrors.city}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="state" placeholder={t('state')} value={newAddressData.state} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.state ? 'border-red-500' : 'border-gray-300'} rounded-md w-full focus:ring-blue-500 focus:border-blue-500`} required />
                                                    {addressFormErrors.state && <p className="text-red-500 text-sm mt-1">{addressFormErrors.state}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-2">
                                                {/* --- FIX 4: Changed name="address_type" to name="addressType" --- */}
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input type="radio" name="addressType" value="Home" checked={newAddressData.addressType === 'Home'} onChange={handleInputChange} className="form-radio h-4 w-4 text-blue-600" />
                                                    <span className="ml-2 text-gray-700">{t('Home')}</span>
                                                </label>
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input type="radio" name="addressType" value="Work" checked={newAddressData.addressType === 'Work'} onChange={handleInputChange} className="form-radio h-4 w-4 text-blue-600" />
                                                    <span className="ml-2 text-gray-700">{t('Work')}</span>
                                                </label>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                            >
                                                {isSubmitting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                                                {isSubmitting ? t('saving') : t('Save Address')}
                                            </button>
                                        </form>
                                    )}

                                    {!showAddressForm && deliveryAddress && (
                                        <>
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('Delivery To')}</h3>
                                            <AddressDisplay address={deliveryAddress} />
                                            <button
                                                onClick={() => { setShowAddressForm(true); setSelectedAddressId('new'); setDeliveryAddress(null); }}
                                                className="mt-4 text-blue-600 font-semibold hover:underline text-sm"
                                            >
                                                {t('change Or Add Address')}
                                            </button>
                                        </>
                                    )}

                                    <button
                                        onClick={() => setActiveStep(2)}
                                        disabled={!deliveryAddress || isSubmitting}
                                        className="w-full mt-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {t('continue To Order Summary')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 2: Order Summary */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button
                                className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800"
                                onClick={() => setActiveStep(2)}
                                disabled={activeStep < 2}
                            >
                                <span className="flex items-center">
                                    {activeStep > 2 ? (
                                        <CheckCircle className="mr-3 h-6 w-6 text-green-600" />
                                    ) : (
                                        <Package className="mr-3 h-6 w-6 text-blue-600" />
                                    )}
                                    {t('orderSummary')}
                                </span>
                                <ChevronDown className={`transition-transform ${activeStep === 2 ? 'rotate-180' : ''}`} />
                            </button>
                            {activeStep === 2 && (
                                <div className="p-5 border-t border-gray-200">
                                    <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {cart.map(item => {
                                            const itemOriginalPrice = item.originalPrice ? Number(item.originalPrice) : Number(item.price);
                                            const itemCurrentPrice = Number(item.price);
                                            const itemDiscount = (itemOriginalPrice > itemCurrentPrice) ? (itemOriginalPrice - itemCurrentPrice) * item.quantity : 0;
                                            const itemTotal = itemCurrentPrice * item.quantity;
                                            return (
                                                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0">
                                                    <div className="flex items-center">
                                                        <img src={item.images?.[0]} alt={item.name} className="w-16 h-16 object-contain rounded-md mr-4 border border-gray-200" />
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{item.name}</p>
                                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                                            <div className="flex items-center mt-1">
                                                                <p className="font-bold text-gray-900 text-base">₹{itemTotal.toFixed(2)}</p>
                                                                {itemOriginalPrice > itemCurrentPrice && (
                                                                    <>
                                                                        <span className="text-sm text-gray-500 line-through ml-2">₹{(itemOriginalPrice * item.quantity).toFixed(2)}</span>
                                                                        <span className="text-sm text-green-600 ml-2">({((itemDiscount / (itemOriginalPrice * item.quantity)) * 100).toFixed(0)}% off)</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setActiveStep(3)}
                                        className="w-full mt-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={cart.length === 0}
                                    >
                                        {t('Continue To Payment')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Payment Options */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button
                                className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800 focus:outline-none"
                                onClick={() => setActiveStep(3)}
                                disabled={activeStep < 3}
                            >
                                <span className="flex items-center">
                                    <CreditCard className="mr-3 h-6 w-6 text-blue-600" /> {t('paymentOptions')}
                                </span>
                                <ChevronDown className={`transition-transform ${activeStep === 3 ? 'rotate-180' : ''}`} />
                            </button>
                            {activeStep === 3 && (
                                <div className="p-5 border-t border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4">{t('choosePaymentMethod')}</h3>
                                    <div className="space-y-4">
                                        {/* UPI Payment Option */}
                                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 ease-in-out focus-within:ring-2 focus-within:ring-purple-500">
                                            <input
                                                type="radio"
                                                name="paymentMethod"
                                                value="upi"
                                                checked={selectedPaymentMethod === 'upi'}
                                                onChange={() => setSelectedPaymentMethod('upi')}
                                                className="form-radio h-5 w-5 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="ml-3 text-lg font-medium text-gray-800 flex items-center">
                                                <Wallet className="h-6 w-auto mr-2 text-indigo-500" />
                                                {t('upiPayment')}
                                            </span>
                                        </label>

                                        {/* Cash on Delivery (COD) Option */}
                                        
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSubmitPayment}
                                        disabled={isSubmitting || isPollingPayment} // Disable if polling is active
                                        className="w-full mt-6 py-3 bg-purple-600 text-white text-lg font-semibold rounded-md hover:bg-purple-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105 active:scale-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                    >
                                        {isSubmitting || isPollingPayment ? <Loader className="animate-spin h-5 w-5 mr-2" /> : (
                                            selectedPaymentMethod === 'upi' ? <CreditCard className="h-5 w-5 mr-2" /> : <Truck className="h-5 w-5 mr-2" />
                                        )}
                                        {isSubmitting ? t('processingPayment') : (isPollingPayment ? t('waitingForPayment') : (selectedPaymentMethod === 'upi' ? t('Pay With UPI') : t('placeOrder')))}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">{t('price Details')}</h3>
                        <div className="space-y-3 mb-4 text-gray-700">
                            <div className="flex justify-between">
                                <span>{t('price')} ({cart.length} {t('items')})</span>
                                <span>₹{originalSubtotal.toFixed(2)}</span>
                            </div>
                            {/* REMOVED: Delivery Charges Display Block */}
                            <div className="flex justify-between text-green-600 font-semibold">
                                <span>{t('Total Discount')} ({totalDiscountPercentage}% off)</span>
                                <span>- ₹{totalDiscount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-gray-900 border-t border-dashed pt-4">
                            <span>{t('Total Amount')}</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <p className="text-green-700 text-sm mt-4 font-semibold">
                                {t('you Will Save')} ₹{totalDiscount.toFixed(2)} {t('on This Order')}!
                            </p>
                        )}
                        {deliveryAddress && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <p className="font-bold text-gray-800 mb-2">{t('shipping To')}:</p>
                                <AddressDisplay address={deliveryAddress} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
