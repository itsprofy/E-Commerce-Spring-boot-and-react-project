// Import necessary React and routing components
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FirebaseProvider } from './contexts/FirebaseContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import ProductList from './components/ProductList';
import ProductSearch from './components/ProductSearch';
import Admin from './components/Admin';
import ProductDetails from './components/ProductDetails';
import Cart from './components/Cart';
import AuthPage from './components/AuthPage';
import TransactionHistory from './components/TransactionHistory';
import ProtectedRoute from './components/ProtectedRoute';
import AdminUserManager from './components/AdminUserManager';
import InitAdmin from './components/InitAdmin';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';

// Main App component that sets up routing and layout
function App() {
  // Migrate cart data to use mainImageUrl instead of imageUrl
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const updatedCart = cart.map(item => {
          // If the item has imageUrl but not mainImageUrl, migrate the data
          if (item.imageUrl && !item.mainImageUrl) {
            return {
              ...item,
              mainImageUrl: item.imageUrl
            };
          }
          return item;
        });
        localStorage.setItem('cart', JSON.stringify(updatedCart));
      }
    } catch (error) {
      console.error('Error migrating cart data:', error);
    }
  }, []);

  return (
    // Firebase Provider wraps the entire app to ensure Firebase is always initialized first
    <FirebaseProvider>
      {/* Router component to enable client-side routing */}
      <Router>
        <div className="App">
          {/* Navigation bar present on all pages */}
          <Navbar />
          {/* Main content container with margin top */}
          <div className="container mt-4">
            {/* Define all application routes */}
            <Routes>
              {/* Home page route */}
              <Route path="/" element={<Home />} />
              {/* Product listing page route */}
              <Route path="/products" element={<ProductList />} />
              {/* Product search page route */}
              <Route path="/search" element={<ProductSearch />} />
              {/* Admin login page route */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Admin />
                </ProtectedRoute>
              } />
              {/* Product details page route with dynamic ID parameter */}
              <Route path="/products/:id" element={<ProductDetails />} />
              {/* Shopping cart page route */}
              <Route path="/cart" element={<Cart />} />
              {/* Auth page route */}
              <Route path="/auth" element={<AuthPage />} />
              {/* Transaction history page route */}
              <Route path="/transactions" element={<TransactionHistory />} />
              {/* Admin user manager page route */}
              <Route path="/admin/users/create" element={
                <ProtectedRoute>
                  <AdminUserManager />
                </ProtectedRoute>
              } />
              {/* InitAdmin page route */}
              <Route path="/init-admin" element={<InitAdmin />} />
            </Routes>
          </div>
        </div>
      </Router>
    </FirebaseProvider>
  );
}

export default App; 