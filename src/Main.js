import React, { useContext } from 'react';
import { AppContext } from './context/AppContext';

import Header from './components/Header';
import Footer from './components/Footer'; // Assuming Footer.jsx exists

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAddProductPage from './pages/AdminAddProductPage';
import OrderPage from './pages/OrderPage';
import WishlistPage from './pages/WishlistPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import OrderDetailPage from './pages/OrderDetailPage'; // <--- NEW: Import OrderDetailPage

const Main = () => {
  const { currentPage } = useContext(AppContext);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'products':
        return <ProductsPage />;
   
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'myorder':
        return <OrderPage />;
      case 'orderDetail': // <--- NEW: Add case for OrderDetailPage
        return <OrderDetailPage />; // <--- NEW: Render OrderDetailPage
      case 'login':
        return <AuthPage isLogin={true} />;
      case 'register':
        return <AuthPage isLogin={false} />;
      case 'profile':
        return <ProfilePage />;
      case 'adminDashboard':
        return <AdminDashboardPage />;
      case 'adminAddProduct':
        return <AdminAddProductPage />;
      case 'wishlist':
        return <WishlistPage />;
      case 'orderConfirmation':
        return <OrderConfirmationPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <Header />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </>
  );
};

export default Main;
