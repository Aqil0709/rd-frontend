import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../context/AppContext';
import { Plus, Edit, Image, IndianRupee, Tag, XCircle, Loader, FileText, Folder } from 'lucide-react';

const AdminAddProductPage = () => {
    const { addProduct, updateProduct, navigate, t, selectedProduct, showNotification } = useContext(AppContext);

    // Step 1: Add description and category to the state
    const [textData, setTextData] = useState({
        name: '',
        description: '', // Added
        category: '',    // Added
        price: '',
        originalPrice: '',
        quantity: '',
    });

    const [newProductImages, setNewProductImages] = useState([]);
    const [currentImagesUrls, setCurrentImagesUrls] = useState([]);
    const [formErrors, setFormErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (selectedProduct) {
            setTextData({
                name: selectedProduct.name || '',
                description: selectedProduct.description || '', // Added
                category: selectedProduct.category || '',       // Added
                price: selectedProduct.price?.toString() || '',
                originalPrice: selectedProduct.originalPrice?.toString() || '',
                quantity: selectedProduct.quantity?.toString() || '',
            });
            setCurrentImagesUrls(selectedProduct.images || []);
            setNewProductImages([]);
            setFormErrors({});
        } else {
            // Reset form for new product
            setTextData({ name: '', description: '', category: '', price: '', originalPrice: '', quantity: '' });
            setNewProductImages([]);
            setCurrentImagesUrls([]);
            setFormErrors({});
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [selectedProduct]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTextData((prevData) => ({ ...prevData, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prevErrors) => ({ ...prevErrors, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const MAX_FILES = 4;
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

        let validFiles = [];
        let newErrors = { ...formErrors };

        if (newErrors.productImage) {
            delete newErrors.productImage;
        }

        if (files.length === 0) {
            setNewProductImages([]);
            setFormErrors(newErrors);
            return;
        }

        if (files.length > MAX_FILES) {
            newErrors.productImage = t('tooManyFiles', { maxFiles: MAX_FILES });
            setFormErrors(newErrors);
            setNewProductImages([]);
            e.target.value = null;
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.size > MAX_FILE_SIZE) {
                newErrors.productImage = t('fileTooLarge', { fileName: file.name, maxSize: '2MB' });
                setFormErrors(newErrors);
                setNewProductImages([]);
                e.target.value = null;
                return;
            }
            validFiles.push(file);
        }

        setNewProductImages(validFiles);
        setFormErrors(newErrors);
    };

    const validateForm = () => {
        let errors = {};
        let isValid = true;

        if (!textData.name.trim()) { errors.name = t('productNameRequired'); isValid = false; }
        
        // Step 2: Add validation for description and category
        if (!textData.description.trim()) { errors.description = t('productDescriptionRequired'); isValid = false; }
        if (!textData.category.trim()) { errors.category = t('productCategoryRequired'); isValid = false; }
        
        const price = parseFloat(textData.price);
        if (isNaN(price) || price <= 0) { errors.price = t('validPriceRequired'); isValid = false; }
        
        if (textData.originalPrice.trim()) {
            const originalPrice = parseFloat(textData.originalPrice);
            if (isNaN(originalPrice) || originalPrice <= 0) {
                errors.originalPrice = t('validOriginalPriceRequired');
                isValid = false;
            } else if (originalPrice < price) {
                errors.originalPrice = t('originalPriceGreaterThanPrice');
                isValid = false;
            }
        }
        
        const quantity = parseInt(textData.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) { errors.quantity = t('validQuantityRequired'); isValid = false; }

        if (!selectedProduct && newProductImages.length === 0) {
            errors.productImage = t('productImageRequired'); isValid = false;
        } 
        else if (selectedProduct && newProductImages.length === 0 && currentImagesUrls.length === 0) {
            errors.productImage = t('productImageRequired'); isValid = false;
        }
        else if (newProductImages.length > 4) {
            errors.productImage = t('tooManyFiles', { maxFiles: 4 }); isValid = false;
        }
        
        setFormErrors(errors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            showNotification(t('pleaseCorrectErrors'), 'error');
            return;
        }

        const formData = new FormData();
        formData.append('name', textData.name.trim());
        
        // Step 3: Append description and category to FormData
        formData.append('description', textData.description.trim());
        formData.append('category', textData.category.trim());
        
        const price = parseFloat(textData.price);
        if (!isNaN(price)) {
            formData.append('price', price);
        } else {
            showNotification('Invalid price value. Please enter a valid number.', 'error');
            setLoading(false);
            return;
        }
        
        const originalPrice = parseFloat(textData.originalPrice);
        if (!isNaN(originalPrice) && textData.originalPrice.trim()) {
            formData.append('originalPrice', originalPrice);
        }
        
        const quantity = parseInt(textData.quantity, 10);
        if (!isNaN(quantity)) {
            formData.append('quantity', quantity);
        } else {
            showNotification('Invalid quantity value. Please enter a valid number.', 'error');
            setLoading(false);
            return;
        }
        
        if (newProductImages.length > 0) {
            newProductImages.forEach((file) => {
                formData.append('productImages', file);
            });
            formData.append('replaceExistingImages', 'true');
        } else if (selectedProduct && currentImagesUrls.length > 0) {
            formData.append('currentImageUrlsToRetain', JSON.stringify(currentImagesUrls));
        }
        
        try {
            if (selectedProduct) {
                await updateProduct(selectedProduct.id, formData);
                showNotification(t('productUpdatedSuccessfully'), 'success');
            } else {
                await addProduct(formData);
                showNotification(t('productAddedSuccessfully'), 'success');
            }
            navigate('adminDashboard');
        } catch (submitError) {
            console.error('Submission error:', submitError);
            setFormErrors((prevErrors) => ({ ...prevErrors, general: submitError.message || t('submissionFailed') }));
            showNotification(submitError.message || t('submissionFailed'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-8 max-w-4xl bg-gray-50 min-h-screen font-inter">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8 text-center">
                {selectedProduct ? t('editProduct') : t('addNewProduct')}
            </h1>

            <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg space-y-8 border border-gray-200">
                {formErrors.general && (
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 animate-fade-in">
                        {formErrors.general}
                    </p>
                )}

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <Tag className="h-6 w-6 mr-3 text-blue-600" /> {t('Product Information')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('productName')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" id="name" name="name" value={textData.name} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('enterProductName')} required aria-invalid={formErrors.name ? "true" : "false"}
                            />
                            {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                        </div>

                        {/* Step 4: Add Description and Category inputs to the form */}
                        <div className="md:col-span-2">
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('productDescription')} <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description" name="description" value={textData.description} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.description ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('enterProductDescription')} required rows="4" aria-invalid={formErrors.description ? "true" : "false"}
                            />
                            {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                        </div>

                        <div className="md:col-span-2">
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('productCategory')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text" id="category" name="category" value={textData.category} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.category ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('enterProductCategory')} required aria-invalid={formErrors.category ? "true" : "false"}
                            />
                            {formErrors.category && <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>}
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <IndianRupee className="h-6 w-6 mr-3 text-green-600" /> {t('Pricing And Inventory')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('Selling Price')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number" id="price" name="price" value={textData.price} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('enter selling price')} required min="0.01" step="0.01" aria-invalid={formErrors.price ? "true" : "false"}
                            />
                            {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
                        </div>
                        <div>
                            <label htmlFor="originalPrice" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('Original Price')} <span className="text-gray-400">({t('optional')})</span>
                            </label>
                            <input
                                type="number" id="originalPrice" name="originalPrice" value={textData.originalPrice} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.originalPrice ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('enterOriginalPrice')} min="0.01" step="0.01" aria-invalid={formErrors.originalPrice ? "true" : "false"}
                            />
                            {formErrors.originalPrice && <p className="mt-1 text-sm text-red-600">{formErrors.originalPrice}</p>}
                        </div>
                        <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                                {t('Quantity')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number" id="quantity" name="quantity" value={textData.quantity} onChange={handleChange}
                                className={`mt-1 block w-full border ${formErrors.quantity ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out`}
                                placeholder={t('Enter Product Quantity')} required min="1" step="1" aria-invalid={formErrors.quantity ? "true" : "false"}
                            />
                            {formErrors.quantity && <p className="mt-1 text-sm text-red-600">{formErrors.quantity}</p>}
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                        <Image className="h-6 w-6 mr-3 text-purple-600" /> {t('Product Media')}
                    </h2>
                    <div>
                        <label htmlFor="productImage" className="block text-sm font-medium text-gray-700 mb-1">
                            {t('Upload Images')} {selectedProduct && currentImagesUrls.length > 0 ? t('replaceExistingImages') : <span className="text-red-500">*</span>}
                        </label>
                        <input
                            type="file" id="productImage" name="productImage" onChange={handleFileChange} ref={fileInputRef}
                            multiple
                            className={`mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${formErrors.productImage ? 'border-red-500' : ''}`}
                            accept="image/png, image/jpeg, image/gif" aria-invalid={formErrors.productImage ? "true" : "false"}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            {t('Max Images 4', { maxImages: 4 })}
                            {selectedProduct && t('selectingNewReplacesOld')}
                        </p>
                        {formErrors.productImage && <p className="mt-1 text-sm text-red-600">{formErrors.productImage}</p>}
                        
                        {(currentImagesUrls.length > 0 || newProductImages.length > 0) && (
                            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-white grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {currentImagesUrls.length > 0 && newProductImages.length === 0 && (
                                    <>
                                        <p className="sm:col-span-2 md:col-span-4 text-sm text-gray-600 mb-2 font-medium">{t('currentImages')}:</p>
                                        {currentImagesUrls.map((url, index) => (
                                            <div key={`current-${index}`} className="relative">
                                                <img src={url} alt={`${t('currentProductImage')} ${index + 1}`} className="h-24 w-24 object-cover rounded-md shadow-sm border border-gray-100" />
                                            </div>
                                        ))}
                                    </>
                                )}
                                {newProductImages.length > 0 && (
                                    <>
                                        <p className="sm:col-span-2 md:col-span-4 text-sm text-blue-800 mb-2 font-medium">{t('newImagesPreview')}:</p>
                                        {newProductImages.map((file, index) => (
                                            <div key={`new-${index}`} className="relative">
                                                <img src={URL.createObjectURL(file)} alt={`${t('newProductImagePreview')} ${index + 1}`} className="h-24 w-24 object-cover rounded-md shadow-sm border border-blue-100" />
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('adminDashboard')}
                        className="flex items-center bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-md"
                    >
                        <XCircle className="h-5 w-5 mr-2" /> {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="flex items-center bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        disabled={loading}
                    >
                        {loading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : (selectedProduct ? <Edit className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />)}
                        {loading ? t('processing') : (selectedProduct ? t('updateProduct') : t('addNewProduct'))}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminAddProductPage;
