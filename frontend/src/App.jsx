import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Customer pages
import Restaurants from './pages/customer/Restaurants';
import RestaurantDetail from './pages/customer/RestaurantDetail';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import Orders from './pages/customer/Orders';
import OrderDetail from './pages/customer/OrderDetail';

// Restaurant pages
import RestaurantSetup from './pages/restaurant/Setup';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantMenu from './pages/restaurant/Menu';
import RestaurantOrders from './pages/restaurant/Orders';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />

              {/* Customer */}
              <Route path="/cart" element={<ProtectedRoute role="customer"><Cart /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute role="customer"><Checkout /></ProtectedRoute>} />
              <Route path="/order-confirmation/:id" element={<ProtectedRoute role="customer"><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute role="customer"><Orders /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute role="customer"><OrderDetail /></ProtectedRoute>} />

              {/* Restaurant */}
              <Route path="/restaurant/setup" element={<ProtectedRoute role="restaurant"><RestaurantSetup /></ProtectedRoute>} />
              <Route path="/restaurant/dashboard" element={<ProtectedRoute role="restaurant"><RestaurantDashboard /></ProtectedRoute>} />
              <Route path="/restaurant/menu" element={<ProtectedRoute role="restaurant"><RestaurantMenu /></ProtectedRoute>} />
              <Route path="/restaurant/orders" element={<ProtectedRoute role="restaurant"><RestaurantOrders /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
