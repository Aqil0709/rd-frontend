import React, { useState, useContext, useEffect } from 'react';
// Ensure the path to your AppContext is correct
import { AppContext } from '../context/AppContext';
import { Truck, MapPin, CreditCard, ChevronDown, Package, CheckCircle, Loader, Wallet, ShieldCheck } from 'lucide-react';

/**
 * A custom hook to dynamically load the Razorpay checkout script.
 * This ensures the script is available before we try to use it.
 */
const useRazorpayScript = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Clean up the script when the component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
};

const CheckoutPage = () => {
    // Load the Razorpay script when the component mounts
    useRazorpayScript();

    // Destructure functions from context, replacing UPI/COD logic with Razorpay
    const { 
        cart, t, currentUser, navigate, 
        addresses, addAddress, showNotification, 
        setCart,
        createRazorpayOrder, // NEW: Function to create an order on your backend
        verifyRazorpayPayment  // NEW: Function to verify payment on your backend
    } = useContext(AppContext);

    // State for managing the new address form
    const [newAddressData, setNewAddressData] = useState({
        name: '', mobile: '', pincode: '', locality: '', address: '', city: '', state: '', addressType: 'Home',
    });

    // State for managing the checkout flow
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [deliveryAddress, setDeliveryAddress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressFormErrors, setAddressFormErrors] = useState({});

    // Effect to set default address or show the form if no addresses exist
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

    // Effect to pre-fill user's name in the address form
    useEffect(() => {
        if (currentUser) {
            setNewAddressData(prev => ({ ...prev, name: currentUser.name || '', email: currentUser.email || '' }));
        }
    }, [currentUser]);

    // --- Price Calculations ---
    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const originalSubtotal = cart.reduce((sum, item) => sum + (item.originalPrice ? Number(item.originalPrice) : Number(item.price)) * Number(item.quantity), 0);
    const total = subtotal;
    const totalDiscount = originalSubtotal - subtotal;
    const totalDiscountPercentage = (originalSubtotal > 0 && totalDiscount > 0)
        ? Math.round((totalDiscount / originalSubtotal) * 100)
        : 0;

    // --- Address Form Handlers (Unchanged) ---
    const handleInputChange = (e) => {
        setNewAddressData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setAddressFormErrors(prev => ({ ...prev, [e.target.name]: '' }));
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
        if (!validateAddressForm()) {
            showNotification(t('pleaseCorrectAddressErrors'), 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            const newlyAddedAddress = await addAddress(newAddressData);
            if (newlyAddedAddress && newlyAddedAddress.id) {
                setDeliveryAddress(newlyAddedAddress);
                setSelectedAddressId(newlyAddedAddress.id);
                setShowAddressForm(false);
                setNewAddressData({ name: currentUser?.name || '', mobile: '', pincode: '', locality: '', address: '', city: '', state: '', addressType: 'Home' });
                setActiveStep(2);
                showNotification(t('addressAddedSuccessfully'), 'success');
            }
        } catch (error) {
            showNotification(error.message || t('failedToAddAddress'), 'error');
        } finally {
            setIsSubmitting(false);
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

    // --- NEW: Razorpay Payment Handler ---
    const handleSubmitPayment = async () => {
        if (!deliveryAddress) {
            showNotification(t('pleaseSelectOrAddAddress'), 'error');
            setActiveStep(1);
            return;
        }
        setIsSubmitting(true);

        try {
            // 1. Create a Razorpay order on your server
            const orderData = await createRazorpayOrder(deliveryAddress.id, total);
            if (!orderData || !orderData.id || !orderData.amount) {
                throw new Error(t('failedToCreateRazorpayOrder'));
            }

            // 2. Configure Razorpay options
            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: "INR",
                name: "RD General Store",
                description: `Order #${orderData.receipt}`,
                order_id: orderData.id,
                handler: async function (response) {
                    // 3. Handle successful payment by verifying it on the backend
                    try {
                        const verificationData = {
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        };
                        const result = await verifyRazorpayPayment(verificationData);
                        if (result.status === 'success') {
                            showNotification(t('paymentSuccessful'), 'success');
                            setCart([]);
                            navigate('orderConfirmation', { orderId: response.razorpay_order_id, status: 'PAID' });
                        } else {
                            throw new Error(t('paymentVerificationFailed'));
                        }
                    } catch (error) {
                         showNotification(error.message || t('paymentVerificationFailed'), 'error');
                    }
                },
                prefill: {
                    name: currentUser?.name || '',
                    email: currentUser?.email || '',
                    contact: deliveryAddress?.mobile || '',
                },
                notes: {
                    address: `${deliveryAddress.address}, ${deliveryAddress.city}`,
                },
                theme: {
                    color: "#4F46E5"
                },
                modal: {
                    ondismiss: function() {
                        showNotification(t('paymentCancelled'), 'info');
                    }
                }
            };

            // 4. Open the Razorpay checkout modal
            const rzp = new window.Razorpay(options);
            rzp.open();
            
            rzp.on('payment.failed', function (response){
                showNotification(`${t('paymentFailed')}: ${response.error.description}`, 'error');
            });

        } catch (error) {
            showNotification(error.message || t('paymentInitiationFailed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---

    if (cart.length === 0) {
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
            {address.addressType && (
                <span className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {t(address.addressType)}
                </span>
            )}
        </div>
    );

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">{t('Checkout')}</h1>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Checkout Steps */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Step 1: Delivery Address */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800" onClick={() => setActiveStep(1)}>
                                <span className="flex items-center">
                                    {activeStep > 1 && deliveryAddress ? <CheckCircle className="mr-3 h-6 w-6 text-green-600" /> : <MapPin className="mr-3 h-6 w-6 text-blue-600" />}
                                    {t('Delivery Address')}
                                </span>
                                <ChevronDown className={`transition-transform ${activeStep === 1 ? 'rotate-180' : ''}`} />
                            </button>
                            {activeStep === 1 && (
                                <div className="p-5 border-t border-gray-200">
                                    {addresses && addresses.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('Select an Address')}</h3>
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
                                            <h3 className="text-lg font-bold text-gray-800 mb-2">{t('Add New Address')}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <input type="text" name="name" placeholder={t('fullName')} value={newAddressData.name} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.name && <p className="text-red-500 text-sm mt-1">{addressFormErrors.name}</p>}
                                                </div>
                                                <div>
                                                    <input type="tel" name="mobile" placeholder={t('mobileNumber')} value={newAddressData.mobile} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.mobile && <p className="text-red-500 text-sm mt-1">{addressFormErrors.mobile}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="pincode" placeholder={t('pincode')} value={newAddressData.pincode} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.pincode ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.pincode && <p className="text-red-500 text-sm mt-1">{addressFormErrors.pincode}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="locality" placeholder={t('locality')} value={newAddressData.locality} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.locality ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.locality && <p className="text-red-500 text-sm mt-1">{addressFormErrors.locality}</p>}
                                                </div>
                                            </div>
                                            <textarea name="address" placeholder={t('addressArea')} value={newAddressData.address} onChange={handleInputChange} className={`w-full p-3 border ${addressFormErrors.address ? 'border-red-500' : 'border-gray-300'} rounded-md`} rows="3" required></textarea>
                                            {addressFormErrors.address && <p className="text-red-500 text-sm mt-1">{addressFormErrors.address}</p>}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <input type="text" name="city" placeholder={t('city')} value={newAddressData.city} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.city && <p className="text-red-500 text-sm mt-1">{addressFormErrors.city}</p>}
                                                </div>
                                                <div>
                                                    <input type="text" name="state" placeholder={t('state')} value={newAddressData.state} onChange={handleInputChange} className={`p-3 border ${addressFormErrors.state ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`} required />
                                                    {addressFormErrors.state && <p className="text-red-500 text-sm mt-1">{addressFormErrors.state}</p>}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 mt-2">
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input type="radio" name="addressType" value="Home" checked={newAddressData.addressType === 'Home'} onChange={handleInputChange} className="form-radio h-4 w-4 text-blue-600" />
                                                    <span className="ml-2 text-gray-700">{t('Home')}</span>
                                                </label>
                                                <label className="inline-flex items-center cursor-pointer">
                                                    <input type="radio" name="addressType" value="Work" checked={newAddressData.addressType === 'Work'} onChange={handleInputChange} className="form-radio h-4 w-4 text-blue-600" />
                                                    <span className="ml-2 text-gray-700">{t('Work')}</span>
                                                </label>
                                            </div>
                                            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white font-bold py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                                                {isSubmitting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                                                {isSubmitting ? t('saving') : t('Save Address')}
                                            </button>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Step 2: Order Summary */}
                         <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800" onClick={() => deliveryAddress && setActiveStep(2)} disabled={!deliveryAddress}>
                                <span className="flex items-center">
                                    {activeStep > 2 ? <CheckCircle className="mr-3 h-6 w-6 text-green-600" /> : <Package className="mr-3 h-6 w-6 text-blue-600" />}
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
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <button onClick={() => setActiveStep(3)} className="w-full mt-6 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700" disabled={cart.length === 0}>
                                        {t('Continue To Payment')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 3: Payment */}
                        <div className="bg-white rounded-lg shadow-md border border-gray-200">
                            <button className="w-full text-left p-5 flex justify-between items-center font-bold text-xl text-gray-800" onClick={() => deliveryAddress && setActiveStep(3)} disabled={!deliveryAddress}>
                                <span className="flex items-center">
                                    <CreditCard className="mr-3 h-6 w-6 text-blue-600" /> {t('paymentOptions')}
                                </span>
                                <ChevronDown className={`transition-transform ${activeStep === 3 ? 'rotate-180' : ''}`} />
                            </button>
                            {activeStep === 3 && (
                                <div className="p-5 border-t border-gray-200">
                                    <div className="p-4 border rounded-lg bg-indigo-50 border-indigo-200">
                                        <span className="text-lg font-medium text-gray-800 flex items-center">
                                            <ShieldCheck className="h-6 w-auto mr-2 text-indigo-600" />
                                            {t('Pay Securely Online')}
                                        </span>
                                        <p className="text-sm text-gray-600 ml-8 mt-1">{t('Supports Cards, UPI, and Wallets')}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSubmitPayment}
                                        disabled={isSubmitting}
                                        className="w-full mt-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-md hover:bg-indigo-700 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {isSubmitting ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <CreditCard className="h-5 w-5 mr-2" />}
                                        {isSubmitting ? t('processing') : `${t('Pay Securely')} ₹${total.toFixed(2)}`}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Price Details */}
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md h-fit sticky top-24 border border-gray-200">
                        <h3 className="text-xl font-bold text-gray-800 border-b pb-4 mb-4">{t('price Details')}</h3>
                        <div className="space-y-3 mb-4 text-gray-700">
                            <div className="flex justify-between">
                                <span>{t('price')} ({cart.length} {t('items')})</span>
                                <span>₹{originalSubtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-semibold">
                                <span>{t('Total Discount')}</span>
                                <span>- ₹{totalDiscount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-bold text-xl text-gray-900 border-t border-dashed pt-4">
                            <span>{t('Total Amount')}</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        {totalDiscount > 0 && (
                            <p className="text-green-700 text-sm mt-4 font-semibold bg-green-50 p-3 rounded-lg">
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
