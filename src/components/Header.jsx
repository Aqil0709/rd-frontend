import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Search, ShoppingCart, User, Menu, X, ShieldCheck, ChevronDown } from 'lucide-react';

const Header = () => {
    const { navigate, cart, currentUser, logout, setSearchTerm, t } = useContext(AppContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleSearchSubmit = (e) => {
        // This function will handle search submission from both desktop and mobile search bars
        if (e.key === 'Enter' || e.type === 'click') {
            navigate('products');
            setIsMenuOpen(false); // Close mobile menu if search is submitted from there
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50 font-inter">
            {/* Main Header Row (visible on all screens) */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-2"> {/* Added gap for spacing */}
                    {/* Brand Logo and Name */}
                    <div className="flex items-center flex-shrink-0">
                        <h1 onClick={() => navigate('home')} className="text-xl md:text-2xl font-bold text-blue-700 cursor-pointer flex items-center transition-colors duration-200 hover:text-blue-900">
                            RD Panshop 
                            
                        </h1>
                    </div>

                    {/* Search Bar (Desktop Only) */}
                    <div className="hidden lg:flex flex-grow max-w-2xl mx-8">
                        {/* This search bar is hidden on 'lg' and smaller, visible on 'lg' and larger */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder={t('searchPlaceholder')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10 pr-4 text-gray-700 placeholder-gray-400"
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleSearchSubmit}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" onClick={handleSearchSubmit} />
                        </div>
                    </div>

                    {/* Right-aligned Icons and Navigation */}
                    <div className="flex items-center space-x-2 sm:space-x-4"> {/* Adjusted spacing for responsiveness */}
                        {/* Cart Icon (Always Visible) */}
                        {/* This cart icon is now part of the main header row for both mobile and desktop */}
                        <div onClick={() => navigate('cart')} className="relative cursor-pointer p-2 rounded-md hover:bg-gray-100 transition-colors duration-200">
                            <ShoppingCart className="h-5 w-5 text-gray-700" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center border-2 border-white">
                                    {cartItemCount}
                                </span>
                            )}
                        </div>

                        {/* Desktop Navigation (User/Login & Admin Panel) */}
                        <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
                            {currentUser && currentUser.role === 'admin' && (
                                <button onClick={() => navigate('adminDashboard')} className="flex items-center text-green-600 font-semibold px-3 py-2 rounded-md hover:bg-green-50 hover:text-green-800 transition-colors duration-200">
                                    <ShieldCheck className="h-5 w-5 mr-1"/>
                                    <span className="text-sm">{t('adminPanel')}</span>
                                </button>
                            )}

                            {currentUser ? (
                                <div className="relative">
                                    <button
                                        className="flex items-center space-x-1 p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    >
                                        <User className="h-5 w-5 text-gray-700" />
                                        <span className="font-medium text-gray-800 text-sm">{currentUser.name?.split(' ')[0]}</span>
                                        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-2 z-10">
                                            <button onClick={() => { navigate('profile'); setIsUserMenuOpen(false);}} className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">{t('profile')}</button>
                                            <button onClick={() => { navigate('myorder'); setIsUserMenuOpen(false);}} className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">{t('My orders')}</button>
                                            <button onClick={() => { logout(); setIsUserMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150">{t('logout')}</button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button onClick={() => navigate('login')} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105">
                                    {t('login')}
                                </button>
                            )}
                        </nav>

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            {isMenuOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- NEW SECTION: Search Bar for Mobile (appears below main header) --- */}
            <div className="lg:hidden container mx-auto px-4 sm:px-6 py-2 border-t border-gray-100">
                {/* This search bar is hidden on 'lg' and larger, visible on 'lg' and smaller */}
                <div className="relative w-full">
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pl-10 pr-4 text-gray-700 placeholder-gray-400 text-sm sm:text-base"
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={handleSearchSubmit}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" onClick={handleSearchSubmit} />
                </div>
            </div>

            {/* Mobile Menu Overlay (Conditional Rendering) */}
            {isMenuOpen && (
                <div className={`fixed inset-0 bg-white z-40 flex flex-col p-6 transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-blue-700">{t('Menu')}</h2>
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-md hover:bg-gray-100">
                            <X className="h-6 w-6 text-gray-700" />
                        </button>
                    </div>

                    {/* Search bar inside mobile menu removed as it's now a separate section */}
                    {/* Cart icon inside mobile menu removed, as it's now always visible in main header */}

                    <nav className="flex flex-col space-y-4 flex-grow">
                        {currentUser && currentUser.role === 'admin' && (
                            <button onClick={() => { navigate('adminDashboard'); setIsMenuOpen(false);}} className="flex items-center text-green-700 font-semibold px-4 py-3 hover:bg-green-50 rounded-md transition-colors duration-200 text-lg">
                                <ShieldCheck className="h-5 w-5 mr-3"/>
                                {t('adminPanel')}
                            </button>
                        )}
                        {currentUser ? (
                            <>
                                <span className="px-4 py-3 text-gray-800 font-semibold text-lg">{t('hi')}, {currentUser.name?.split(' ')[0]}!</span>
                                <button onClick={() => { navigate('profile'); setIsMenuOpen(false);}} className="text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200 text-lg">{t('profile')}</button>
                                <button onClick={() => { navigate('myorder'); setIsMenuOpen(false);}} className="text-left px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200 text-lg">{t('My order')}</button>
                                <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200">{t('logout')}</button>
                            </>
                        ) : (
                            <button onClick={() => { navigate('login'); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200">
                                {t('login')}
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;