import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-xl text-gray-900">Local<span className="text-brand-500">Bite</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {!user && (
              <>
                <Link to="/restaurants" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Browse Restaurants</Link>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Login</Link>
                <Link to="/signup" className="btn-primary text-sm">Sign Up</Link>
              </>
            )}
            {user?.role === 'customer' && (
              <>
                <Link to="/restaurants" className="text-gray-600 hover:text-gray-900 font-medium">Browse</Link>
                <Link to="/orders" className="text-gray-600 hover:text-gray-900 font-medium">My Orders</Link>
                <Link to="/cart" className="text-gray-600 hover:text-gray-900 font-medium">🛒 Cart</Link>
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-gray-700 font-medium hover:text-gray-900">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                      {user.full_name[0].toUpperCase()}
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-44 card py-1 shadow-lg">
                      <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">{user.full_name}</div>
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign out</button>
                    </div>
                  )}
                </div>
              </>
            )}
            {user?.role === 'restaurant' && (
              <>
                <Link to="/restaurant/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
                <Link to="/restaurant/orders" className="text-gray-600 hover:text-gray-900 font-medium">Orders</Link>
                <Link to="/restaurant/menu" className="text-gray-600 hover:text-gray-900 font-medium">Menu</Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-600 font-medium text-sm">Sign out</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
