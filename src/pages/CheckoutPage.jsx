import React, { useState, useContext, useEffect } from 'react';
// Ensure the path to your AppContext is correct
import { AppContext } from '../context/AppContext';
import { Truck, MapPin, CreditCard, ChevronDown, Package, CheckCircle, Loader, Wallet, ShieldCheck } from 'lucide-react';

/**
 * A custom hook to dynamically load the Razorpay checkout script.
 */
const useRazorpayScript = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
};

const CheckoutPage = () => {
    useRazorpayScript();

    const { 
        cart, t, currentUser, navigate, 
        addresses, addAddress, showNotification, 
        setCart,
        createRazorpayOrder,
        verifyRazorpayPayment
    } = useContext(AppContext);

    const [newAddressData, setNewAddressData] = useState({
        name: '', mobile: '', pincode: '', locality: '', address: '', city: '', state: '', addressType: 'Home',
    });

    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [activeStep, setActiveStep] = useState(1);
    const [deliveryAddress, setDeliveryAddress] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressFormErrors, setAddressFormErrors] = useState({});

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
            setNewAddressData(prev => ({ ...prev, name: currentUser.name || '', email: currentUser.email || '' }));
        }
    }, [currentUser]);

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const originalSubtotal = cart.reduce((sum, item) => sum + (item.originalPrice ? Number(item.originalPrice) : Number(item.price)) * Number(item.quantity), 0);
    const total = subtotal;
    const totalDiscount = originalSubtotal - subtotal;

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

    const handleSubmitPayment = async () => {
        if (!deliveryAddress) {
            showNotification(t('pleaseSelectOrAddAddress'), 'error');
            setActiveStep(1);
            return;
        }
        setIsSubmitting(true);

        try {
            const orderData = await createRazorpayOrder(deliveryAddress.id, total);
            if (!orderData || !orderData.order_id || !orderData.amount) {
                throw new Error(t('failedToCreateRazorpayOrder'));
            }

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: "INR",
                name: "RD General Store",
                description: `Order #${orderData.receipt}`,
                order_id: orderData.order_id,
                handler: async function (response) {
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
                    <div className="lg:col-span-2 space-y-4">
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
                                    {/* Address selection and form rendering logic */}
                                </div>
                            )}
                        </div>
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
                                    {/* Cart items rendering logic */}
                                </div>
                            )}
                        </div>
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

// --- THIS IS THE CRUCIAL FIX ---
// Ensure the component is exported by default
export default CheckoutPage;
