import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { PlusCircle, User as UserIcon, Mail, Phone, MapPin, Home, Briefcase, Save, XCircle, Edit2, Loader, ShoppingBag, Heart } from 'lucide-react'; // Import more icons
import OrderPage from './OrderPage';
import WishlistPage from './WishlistPage';

const ProfilePage = () => {
    const { currentUser, addresses, updateUserProfile, addAddress, t, navigate, authLoading } = useContext(AppContext);
    const [isEditingProfile, setIsEditingProfile] = useState(false); // Changed from isEditingName
    const [name, setName] = useState(currentUser ? currentUser.name : '');
    const [mobileNumber, setMobileNumber] = useState(currentUser ? currentUser.mobileNumber : ''); // New state for mobileNumber
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
    const [profileUpdateError, setProfileUpdateError] = useState(null);
    const [selectedSection, setSelectedSection] = useState('personalInfo'); // State to manage selected section

    useEffect(() => {
        if (!currentUser) {
            navigate('login');
        } else {
            setName(currentUser.name);
            setMobileNumber(currentUser.mobileNumber); // Initialize mobileNumber state
        }
    }, [currentUser, navigate]);

    // Renamed handleNameSubmit to handleProfileSubmit as it now updates more fields
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileUpdateLoading(true);
        setProfileUpdateError(null);

        console.log("ProfilePage: Attempting to update profile with name:", name, "mobile:", mobileNumber);

        try {
            // Pass both name and mobileNumber to updateUserProfile
            await updateUserProfile({ name: name, mobileNumber: mobileNumber });
            setIsEditingProfile(false); // Close edit mode on success
        } catch (error) {
            setProfileUpdateError(error.message || t('failedToUpdateProfile'));
        } finally {
            setProfileUpdateLoading(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
                <div className="text-center p-8 bg-white rounded-lg shadow-xl">
                    <Loader className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-gray-700">{t('loadingProfile')}</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (selectedSection) {
            case 'personalInfo':
                return (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-100">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <UserIcon className="h-6 w-6 mr-2 text-blue-600" /> {t('personalInformation')}
                        </h2>
                        {isEditingProfile ? ( // Use isEditingProfile
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="nameInput" className="block text-sm font-medium text-gray-700 mb-1">{t('fullName')}</label>
                                    <input
                                        type="text"
                                        id="nameInput"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="mobileInput" className="block text-sm font-medium text-gray-700 mb-1">{t('Mobile')}</label>
                                    <input
                                        type="tel" // Use type="tel" for mobile numbers
                                        id="mobileInput"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value)}
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                        required
                                    />
                                </div>
                                {profileUpdateError && <p className="text-red-600 text-sm mt-2">{profileUpdateError}</p>}
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                        disabled={profileUpdateLoading}
                                    >
                                        {profileUpdateLoading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                        {profileUpdateLoading ? t('saving') : t('saveChanges')}
                                    </button>
                                    <button
                                        type="button"
                                        // Reset both name and mobileNumber on cancel
                                        onClick={() => { setIsEditingProfile(false); setName(currentUser.name); setMobileNumber(currentUser.mobileNumber); setProfileUpdateError(null); }}
                                        className="flex-1 bg-gray-200 text-gray-800 py-2.5 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200 flex items-center justify-center"
                                    >
                                        <XCircle className="h-5 w-5 mr-2" /> {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 text-gray-700">
                                <p className="flex items-center"><UserIcon className="h-5 w-5 mr-3 text-gray-500" /><span className="font-semibold">{t('fullName')}:</span> {currentUser.name}</p>
                                {/* Removed email line */}
                                <p className="flex items-center"><Phone className="h-5 w-5 mr-3 text-gray-500" /><span className="font-semibold">{t('Mobile')}:</span> {currentUser.mobileNumber || t('notProvided')}</p>
                                <button onClick={() => setIsEditingProfile(true)} className="mt-4 flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                    <Edit2 className="h-4 w-4 mr-2" /> {t('edit')}
                                </button>
                            </div>
                        )}
                    </div>
                );
            case 'manageAddresses':
                return (
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                                <MapPin className="h-6 w-6 mr-2 text-blue-600" /> {t('manageAddresses')}
                            </h2>
                            <button
                                onClick={() => setShowAddressForm(true)}
                                className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
                            >
                                <PlusCircle className="mr-2 h-5 w-5" />
                                {t('addNewAddress')}
                            </button>
                        </div>

                        {showAddressForm && <AddressForm closeForm={() => setShowAddressForm(false)} />}

                        <div className="space-y-6 mt-6">
                            {addresses.length > 0 ? (
                                addresses.map(addr => (
                                    <div key={addr.id} className="border border-gray-200 p-5 rounded-lg shadow-sm bg-gray-50 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                                                {addr.address_type === 'Home' ? <Home className="h-4 w-4 mr-1" /> : <Briefcase className="h-4 w-4 mr-1" />}
                                                {addr.address_type}
                                            </span>
                                            {/* Add Edit/Delete buttons for addresses here if desired */}
                                        </div>
                                        <p className="font-bold text-gray-900 mt-2">{addr.name} <span className="font-normal text-gray-600 ml-4 flex items-center"><Phone className="h-4 w-4 mr-1" />{addr.mobile}</span></p>
                                        <p className="text-gray-700 mt-1">{addr.address}, {addr.locality}</p>
                                        <p className="text-gray-700">{addr.city}, {addr.state} - <span className="font-semibold text-gray-800">{addr.pincode}</span></p>
                                    </div>
                                ))
                            ) : (
                                !showAddressForm && <p className="text-gray-500 text-center py-8 text-lg">{t('noAddressesFound')}</p>
                            )}
                        </div>
                    </div>
                );
            case 'myOrders':
                return <OrderPage />;
            case 'wishlist':
                return <WishlistPage />;
            default:
                return null;
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-blue-100 min-h-screen p-4 md:p-8 font-inter">
            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">{t('My Profile')}</h1>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Left Column: Navigation Sidebar */}
                    <div className="md:col-span-1 bg-white rounded-xl shadow-lg h-fit border border-blue-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('hello')},</h3>
                            <p className="text-xl font-bold text-gray-900">{currentUser.name || t('guest')}</p>
                        </div>
                        <nav className="py-4">
                            <button
                                onClick={() => setSelectedSection('personalInfo')}
                                className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-colors duration-200 ${
                                    selectedSection === 'personalInfo' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <UserIcon className="h-5 w-5 mr-3" /> {t('personalInformation')}
                            </button>
                            <button
                                onClick={() => setSelectedSection('manageAddresses')}
                                className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-colors duration-200 ${
                                    selectedSection === 'manageAddresses' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <MapPin className="h-5 w-5 mr-3" /> {t('manageAddresses')}
                            </button>
                            <button
                                onClick={() => setSelectedSection('myOrders')}
                                className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-colors duration-200 ${
                                    selectedSection === 'myOrders' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <ShoppingBag className="h-5 w-5 mr-3" /> {t('My Orders')}
                            </button>
                            <button
                                onClick={() => setSelectedSection('wishlist')}
                                className={`w-full text-left flex items-center px-6 py-3 text-lg font-medium transition-colors duration-200 ${
                                    selectedSection === 'wishlist' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <Heart className="h-5 w-5 mr-3" /> {t('My Wishlist')}
                            </button>
                            {/* Add more navigation items here */}
                        </nav>
                    </div>

                    {/* Right Column: Content Area */}
                    <div className="md:col-span-3">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddressForm = ({ closeForm }) => {
    const { addAddress, t } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: '', mobile: '', pincode: '', locality: '',
        address: '', city: '', state: '', address_type: 'Home'
    });
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError(null);
        try {
            await addAddress(formData);
            closeForm(); // Close form only on success
        } catch (error) {
            setFormError(error.message || t('failedToAddAddress'));
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="border-t border-gray-200 pt-6 mt-4 bg-gray-50 p-6 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('addAddressDetails')}</h3>
            {formError && <p className="text-red-600 text-sm mb-4">{formError}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={formData.name} onChange={handleChange} placeholder={t('fullName')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder={t('mobileNumber')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="pincode" value={formData.pincode} onChange={handleChange} placeholder={t('pincode')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="locality" value={formData.locality} onChange={handleChange} placeholder={t('locality')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" className="md:col-span-2" required />
                <textarea name="address" value={formData.address} onChange={handleChange} placeholder={t('addressArea')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2" rows="3" required></textarea>
                <input name="city" value={formData.city} onChange={handleChange} placeholder={t('city')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                <input name="state" value={formData.state} onChange={handleChange} placeholder={t('state')} className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('addressType')}</label>
                    <div className="flex items-center space-x-6">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="address_type" value="Home" checked={formData.address_type === 'Home'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600 transition-colors duration-150" />
                            <span className="ml-2 text-gray-700">{t('home')}</span>
                        </label>
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="radio" name="address_type" value="Work" checked={formData.address_type === 'Work'} onChange={handleChange} className="form-radio h-4 w-4 text-blue-600 transition-colors duration-150" />
                            <span className="ml-2 text-gray-700">{t('work')}</span>
                        </label>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="flex items-center bg-gray-200 text-gray-800 py-2.5 px-5 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-sm"
                        disabled={formLoading}
                    >
                        <XCircle className="h-5 w-5 mr-2" /> {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        className="flex items-center bg-blue-600 text-white py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={formLoading}
                    >
                        {formLoading ? <Loader className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                        {formLoading ? t('saving') : t('save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;