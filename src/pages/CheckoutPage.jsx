/* global __app_id */
import React, { useState, createContext, useEffect, useCallback } from 'react';
import { locales } from '../translations/locales'; // Ensure this path is correct

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // --- DYNAMIC API URLS ---
    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? 'https://rd-backend-0e7p.onrender.com'
        : 'http://localhost:5002';

    // --- State Variables ---
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [language, setLanguage] = useState('en');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [authError, setAuthError] = useState(null);
    const [authLoading, setAuthLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [errorOrders, setErrorOrders] = useState(null);
    const [stock, setStock] = useState([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [errorStock, setErrorStock] = useState(null);
    const [notification, setNotification] = useState(null);

    // --- Localization function ---
    const t = useCallback((key, options) => {
        let message = locales[language][key] || key;
        if (options) {
            Object.keys(options).forEach(k => {
                message = message.replace(`{${k}}`, options[k]);
            });
        }
        return message;
    }, [language]);

    // --- Navigation function ---
    const navigate = useCallback((page, data = null) => {
        setCurrentPage(page);
        if (data) setSelectedProduct(data);
        window.scrollTo(0, 0);
    }, []);

    // --- Notification function ---
    const showNotification = useCallback((message, type = 'info', duration = 3000) => {
        setNotification({ message, type });
        const timer = setTimeout(() => {
            setNotification(null);
        }, duration);
        return () => clearTimeout(timer);
    }, []);

    // --- Razorpay Order Functions ---
    const createRazorpayOrder = useCallback(async (deliveryAddressId, totalAmount) => {
        if (!currentUser) {
            showNotification(t('pleaseLoginToPlaceOrder'), 'error');
            throw new Error("User not logged in.");
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    receipt: `receipt_order_${new Date().getTime()}`,
                    deliveryAddressId: deliveryAddressId, // THIS LINE IS CRUCIAL
                    cart: cart.map(item => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price,
                        originalPrice: item.originalPrice || item.price,
                        images: item.images
                    }))
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create Razorpay order');
            }
            return data;
        } catch (error) {
            console.error("Error creating Razorpay order:", error);
            showNotification(error.message || 'Failed to create payment order', 'error');
            throw error;
        }
    }, [currentUser, cart, showNotification, t, API_BASE_URL]);

    const verifyRazorpayPayment = useCallback(async (verificationData) => {
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/payment/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(verificationData),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Payment verification failed');
            }
            return data;
        } catch (error) {
            console.error("Error verifying Razorpay payment:", error);
            showNotification(error.message || 'Payment verification failed', 'error');
            throw error;
        }
    }, [showNotification, API_BASE_URL]);

    // --- Fetch a single order by ID ---
    const fetchOrderById = useCallback(async (orderId) => {
        if (!currentUser) {
            showNotification(t('pleaseLoginToViewOrder'), 'error');
            throw new Error("User not logged in.");
        }
        setIsLoadingOrders(true);
        setErrorOrders(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${currentUser.id}/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || t('failedToFetchOrderDetails'));
            }
            const data = await response.json();
            return data;
        } catch (err) {
            console.error("Error fetching single order:", err);
            setErrorOrders(err.message);
            showNotification(err.message || t('failedToFetchOrderDetails'), 'error');
            throw err;
        } finally {
            setIsLoadingOrders(false);
        }
    }, [currentUser, showNotification, t, API_BASE_URL]);

    // --- Fetch Products ---
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/products`);
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            } else {
                throw new Error(`Failed to fetch products: ${response.status}`);
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [API_BASE_URL]);

    // --- Fetch My Orders (User Specific) ---
    const fetchMyOrders = useCallback(async () => {
        if (!currentUser) {
            return;
        }
        setIsLoadingOrders(true);
        setErrorOrders(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                throw new Error(`Failed to fetch your orders: ${response.status}`);
            }
        } catch (err) {
            console.error("Error fetching user orders:", err);
            setErrorOrders(err.message);
        } finally {
            setIsLoadingOrders(false);
        }
    }, [currentUser, API_BASE_URL]);

    // --- Fetch All Orders (Admin Specific) ---
    const fetchOrders = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            return;
        }
        setIsLoadingOrders(true);
        setErrorOrders(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                throw new Error(`Failed to fetch orders: ${response.status}`);
            }
        } catch (err) {
            console.error("Error fetching orders:", err);
            setErrorOrders(err.message);
        } finally {
            setIsLoadingOrders(false);
        }
    }, [currentUser, API_BASE_URL]);

    // --- Fetch Stock (Admin Specific) ---
    const fetchStock = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            return;
        }
        setIsLoadingStock(true);
        setErrorStock(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/stock`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStock(data);
            } else {
                throw new Error(`Failed to fetch stock: ${response.status}`);
            }
        } catch (err) {
            console.error("Error fetching stock:", err);
            setErrorStock(err.message);
        } finally {
            setIsLoadingStock(false);
        }
    }, [currentUser, API_BASE_URL]);

    // --- Update Order Status (Admin Specific) ---
    const updateOrderStatus = useCallback(async (orderId, newStatus) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedAction'), 'error');
            throw new Error("Unauthorized");
        }
        const token = localStorage.getItem('shopkartToken');

        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update order status');
        }
        return data;
    }, [currentUser, showNotification, t, API_BASE_URL]);

    // --- Update Stock (Admin Specific) ---
    const updateStock = useCallback(async (productId, newQuantity, productName) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToUpdateStock'), 'error');
            return;
        }
        setIsLoadingStock(true);
        setErrorStock(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/stock/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity, productName: productName })
            });
            if (response.ok) {
                await fetchStock();
                showNotification(t('stockUpdatedSuccessfully'), 'success');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || t('failedToUpdateStockGeneric'));
            }
        } catch (err) {
            console.error("Error updating stock:", err);
            setErrorStock(err.message);
            showNotification(err.message || t('failedToUpdateStock'), 'error');
            throw err;
        } finally {
            setIsLoadingStock(false);
        }
    }, [currentUser, fetchStock, showNotification, t, API_BASE_URL]);

    // --- Add Stock Item (Admin Specific) ---
    const addStockItem = useCallback(async (productId, quantity, productName) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToAddStock'), 'error');
            throw new Error("Unauthorized");
        }
        setIsLoadingStock(true);
        setErrorStock(null);
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: productId, productName: productName, quantity: quantity })
            });

            const data = await response.json();
            if (response.ok) {
                await fetchStock();
                showNotification(data.message || t('stockAddedSuccessfully'), 'success');
            } else {
                throw new Error(data.message || t('failedToAddStockGeneric'));
            }
        } catch (err) {
            console.error("Error adding stock:", err);
            setErrorStock(err.message);
            showNotification(err.message || t('failedToAddStock'), 'error');
            throw err;
        } finally {
            setIsLoadingStock(false);
        }
    }, [currentUser, fetchStock, showNotification, t, API_BASE_URL]);

    // --- Generate New Product with Initial Stock (Admin Specific, uses LLM) ---
    const generateNewProductWithInitialStock = useCallback(async () => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToGenerateProducts'), 'error');
            throw new Error("Unauthorized");
        }

        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('shopkartToken');
        if (!token) {
            showNotification(t('authenticationRequired'), 'error');
            navigate('login');
            setIsLoading(false);
            throw new Error("Authentication token not found.");
        }

        try {
            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: "Generate a unique and creative product name and a very short, catchy description for an e-commerce store. Provide it in JSON format like: { \"name\": \"Product Name\", \"description\": \"Short description.\" }" }] });
            const payload = {
                contents: chatHistory,
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "OBJECT",
                        properties: {
                            "name": { "type": "STRING" },
                            "description": { "type": "STRING" }
                        },
                        "propertyOrdering": ["name", "description"]
                    }
                }
            };
            // Use the global __app_id provided by Canvas
            const apiKey = typeof __app_id !== 'undefined' ? __app_id : '';
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const llmResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const llmResult = await llmResponse.json();
            let generatedProductName = "Generated Product";
            let generatedProductDescription = "A product generated by AI.";
            let generatedCategory = "Generated";

            if (llmResult.candidates && llmResult.candidates.length > 0 &&
                llmResult.candidates[0].content && llmResult.candidates[0].content.parts &&
                llmResult.candidates[0].content.parts.length > 0) {
                try {
                    const llmJson = JSON.parse(llmResult.candidates[0].content.parts[0].text);
                    generatedProductName = llmJson.name || generatedProductName;
                    generatedProductDescription = llmJson.description || generatedProductDescription;
                } catch (parseError) {
                    console.error("Failed to parse LLM JSON response:", parseError);
                }
            } else {
                console.warn("LLM response structure unexpected or empty.");
            }

            const generatedQuantity = Math.floor(Math.random() * 91) + 10;

            const addProductResponse = await fetch(`${API_BASE_URL}/products/add-generated`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: generatedProductName,
                    description: generatedProductDescription,
                    price: parseFloat((Math.random() * (500 - 10) + 10).toFixed(2)),
                    category: generatedCategory,
                    images: ['https://placehold.co/300x300/cccccc/000000?text=AI+Product']
                })
            });

            const newProductData = await addProductResponse.json();
            if (!addProductResponse.ok) {
                throw new Error(newProductData.message || t('failedToAddGeneratedProduct'));
            }

            const newProductId = newProductData.productId;

            await addStockItem(newProductId, generatedQuantity, generatedProductName);

            showNotification(t('generatedProductAddedSuccessfully'), 'success');
            await fetchProducts();
        } catch (err) {
            console.error("Error generating and adding product:", err);
            setError(err.message || t('errorGeneratingProduct'));
            showNotification(err.message || t('errorGeneratingProduct'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, addStockItem, fetchProducts, navigate, showNotification, t, API_BASE_URL]);

    // --- Initial Data Fetch on Component Mount ---
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // --- Load User from Local Storage on Mount ---
    useEffect(() => {
        const storedUser = localStorage.getItem('shopkartUser');
        const storedToken = localStorage.getItem('shopkartToken');
        if (storedUser && storedToken) {
            const userData = JSON.parse(storedUser);
            setCurrentUser(userData);
        }
    }, []);

    // --- Fetch User-Specific Data on User Change ---
    useEffect(() => {
        const fetchDataOnUserChange = async () => {
            if (currentUser) {
                const token = localStorage.getItem('shopkartToken');
                const headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                };

                try {
                    const cartResponse = await fetch(`${API_BASE_URL}/cart/${currentUser.id}`, { headers });
                    if (cartResponse.ok) setCart(await cartResponse.json());
                } catch (error) { console.error('Error fetching cart:', error); }

                try {
                    const addressResponse = await fetch(`${API_BASE_URL}/profile/${currentUser.id}/addresses`, { headers });
                    if (addressResponse.ok) setAddresses(await addressResponse.json());
                } catch (error) { console.error('Error fetching addresses:', error); }

                if (currentUser.role === 'admin') {
                    fetchOrders();
                    fetchStock();
                } else {
                    fetchMyOrders();
                }
            } else {
                // Clear user-specific data on logout
                setCart([]);
                setAddresses([]);
                setOrders([]);
                setStock([]);
            }
        };

        fetchDataOnUserChange();
    }, [currentUser, fetchOrders, fetchMyOrders, fetchStock, API_BASE_URL]);

    // --- Authentication Functions ---
    const register = async (userData) => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            const data = await response.json();
            if (!response.ok) {
                setAuthError(data.message || t('registrationFailed'));
                return { success: false, message: data.message || t('registrationFailed') };
            }
            await login({ mobileNumber: userData.mobileNumber, password: userData.password });
            return { success: true, message: t('registrationSuccessful') };
        } catch (error) {
            console.error('Registration failed:', error);
            setAuthError(error.message || t('unexpectedRegistrationError'));
            return { success: false, message: error.message || t('unexpectedRegistrationError') };
        } finally {
            setAuthLoading(false);
        }
    };

    const login = async (userData) => {
        setAuthLoading(true);
        setAuthError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok) {
                setAuthError(data.message || t('loginFailed'));
                return;
            }
            const user = { id: data.id, name: data.name, mobileNumber: data.mobileNumber, role: data.role };
            setCurrentUser(user);
            localStorage.setItem('shopkartUser', JSON.stringify(user));
            localStorage.setItem('shopkartToken', data.token);
            navigate('home');
        } catch (error) {
            console.error('Login failed:', error);
            setAuthError(t('unexpectedLoginError'));
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('shopkartUser');
        localStorage.removeItem('shopkartToken');
        setCart([]);
        setAddresses([]);
        setOrders([]);
        setStock([]);
        navigate('home');
    };

    // --- 2Factor OTP & Password Reset Functions ---
    const sendOtp = async (mobileNumber) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error sending OTP:", error);
            return { success: false, message: t('failedToSendOtpNetwork') };
        }
    };

    const verifyOtp = async (mobileNumber, otp, sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, otp, sessionId }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error verifying OTP:", error);
            return { success: false, message: t('otpVerificationFailedNetwork') };
        }
    };

    const sendPasswordResetOtp = async (mobileNumber) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error sending password reset OTP:", error);
            return { success: false, message: t('failedToSendOtpNetwork') };
        }
    };

    const resetPassword = async ({ mobileNumber, password, otpSessionId }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobileNumber, newPassword: password, sessionId: otpSessionId }),
            });
            return await response.json();
        } catch (error) {
            console.error("Error resetting password:", error);
            return { success: false, message: t('passwordResetFailedNetwork') };
        }
    };


    // --- Cart Management Functions ---
    const addToCart = async (productToAdd) => {
        if (!currentUser) {
            showNotification(t('pleaseLoginToAddCart'), 'info');
            navigate('login');
            return;
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${currentUser.id}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: productToAdd.id,
                    name: productToAdd.name,
                    price: productToAdd.price,
                    originalPrice: productToAdd.originalPrice || productToAdd.price,
                    images: productToAdd.images
                }),
            });
            const updatedCart = await response.json();
            if (response.ok) {
                setCart(updatedCart);
                showNotification(t('productAddedToCart'), 'success');
            } else {
                showNotification(updatedCart.message || t('failedToAddCart'), 'error');
            }
        } catch (error) {
            console.error('Failed to add to cart:', error);
            showNotification(t('failedToAddCartNetwork'), 'error');
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (!currentUser) return;
        const token = localStorage.getItem('shopkartToken');
        if (newQuantity <= 0) {
            await removeFromCart(productId);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${currentUser.id}/update/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantity: newQuantity }),
            });
            const updatedCart = await response.json();
            if (response.ok) {
                setCart(updatedCart);
                showNotification(t('cartUpdated'), 'success');
            } else {
                showNotification(updatedCart.message || t('failedToUpdateCart'), 'error');
            }
        } catch (error) {
            console.error('Failed to update quantity:', error);
            showNotification(t('failedToUpdateCartNetwork'), 'error');
        }
    };

    const removeFromCart = async (productId) => {
        if (!currentUser) return;
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/cart/${currentUser.id}/remove/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });
            const updatedCart = await response.json();
            if (response.ok) {
                setCart(updatedCart);
                showNotification(t('productRemovedFromCart'), 'success');
            } else {
                showNotification(updatedCart.message || t('failedToRemoveFromCart'), 'error');
            }
        } catch (error) {
            console.error('Failed to remove from cart:', error);
            showNotification(t('failedToRemoveFromCartNetwork'), 'error');
        }
    };

    // --- User Profile and Address Management ---
    const updateUserProfile = useCallback(async (updatedFields) => {
        if (!currentUser) {
            showNotification(t('pleaseLoginToUpdateProfile'), 'error');
            throw new Error("User not logged in.");
        }
        const token = localStorage.getItem('shopkartToken');
        if (!token) {
            showNotification(t('authenticationRequired'), 'error');
            throw new Error("Authentication token not found.");
        }

        try {
            const response = await fetch(`${API_BASE_URL}/profile/${currentUser.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedFields),
            });
            const updatedUser = await response.json();
            if (response.ok) {
                setCurrentUser(prev => ({ ...prev, ...updatedUser }));
                localStorage.setItem('shopkartUser', JSON.stringify({ ...currentUser, ...updatedUser }));
                showNotification(updatedUser.message || t('profileUpdatedSuccessfully'), 'success');
                return updatedUser;
            } else {
                throw new Error(updatedUser.message || t('failedToUpdateProfile'));
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            showNotification(error.message || t('failedToUpdateProfileNetwork'), 'error');
            throw error;
        }
    }, [currentUser, showNotification, t, API_BASE_URL]);

    const addAddress = useCallback(async (addressData) => {
        if (!currentUser) {
            showNotification(t('pleaseLoginToAddAddress'), 'error');
            throw new Error("User not logged in.");
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/profile/${currentUser.id}/addresses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(addressData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('failedToAddAddress'));
            }
            
            const newAddress = data.address;
            setAddresses(prevAddresses => [...prevAddresses, newAddress]);
            showNotification(data.message || t('addressAddedSuccessfully'), 'success');
            return newAddress;

        } catch (error) {
            console.error('Failed to add address:', error);
            showNotification(error.message || t('failedToAddAddressNetwork'), 'error');
            throw error;
        }
    }, [currentUser, showNotification, t, API_BASE_URL]);

    // --- Product Management (Admin Specific) ---
    const addProduct = useCallback(async (formData) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToAddProduct'), 'error');
            return;
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/products/add`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const newProductData = await response.json();
            if (response.ok) {
                await fetchProducts();
            } else {
                throw new Error(newProductData.message || t('failedToAddProduct'));
            }
        } catch (error) {
            console.error("Failed to add product:", error);
            throw error;
        }
    }, [currentUser, fetchProducts, showNotification, t, API_BASE_URL]);

    const updateProduct = useCallback(async (productId, formData) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToUpdateProduct'), 'error');
            return;
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/products/update/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const updatedProductData = await response.json();
            if (response.ok) {
                await fetchProducts();
            } else {
                throw new Error(updatedProductData.message || t('failedToUpdateProduct'));
            }
        } catch (error) {
            console.error("Failed to update product:", error);
            throw error;
        }
    }, [currentUser, fetchProducts, showNotification, t, API_BASE_URL]);

    const deleteProduct = useCallback(async (productId) => {
        if (!currentUser || currentUser.role !== 'admin') {
            showNotification(t('unauthorizedToDeleteProduct'), 'error');
            throw new Error("Unauthorized");
        }
        const token = localStorage.getItem('shopkartToken');
        try {
            const response = await fetch(`${API_BASE_URL}/products/delete/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || t('failedToDeleteProductGeneric'));
            }

            await fetchProducts();
            showNotification(t('productDeletedSuccess'), 'success');

        } catch (error) {
            console.error('Error deleting product:', error);
            showNotification(error.message || t('failedToDeleteProduct'), 'error');
            throw error;
        }
    }, [currentUser, fetchProducts, showNotification, t, API_BASE_URL]);

    // --- Filtered Products based on Search Term ---
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Context Value ---
    const value = {
        products, cart, currentUser, addresses, currentPage, selectedProduct, searchTerm, filteredProducts, language, t,
        isLoading, error,
        authError, authLoading,
        orders, isLoadingOrders, errorOrders,
        stock, isLoadingStock, errorStock,
        notification,
        setLanguage, navigate, login, addProduct, register, logout, addToCart, updateQuantity, removeFromCart, updateUserProfile, addAddress, setSearchTerm,
        deleteProduct,
        updateProduct,
        fetchProducts,
        setSelectedProduct,
        fetchOrders,
        fetchMyOrders,
        fetchStock,
        updateStock,
        showNotification,
        addStockItem,
        fetchOrderById,
        updateOrderStatus,
        generateNewProductWithInitialStock,
        sendOtp,
        verifyOtp,
        sendPasswordResetOtp,
        resetPassword,
        createRazorpayOrder,
        verifyRazorpayPayment,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
