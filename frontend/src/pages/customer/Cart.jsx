import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = () => api.getCart().then(setCart).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { loadCart(); }, []);

  const updateQty = async (itemId, qty) => {
    if (qty < 1) {
      await api.removeCartItem(itemId);
    } else {
      await api.updateCartItem(itemId, { quantity: qty });
    }
    loadCart();
  };

  const removeItem = async (itemId) => {
    await api.removeCartItem(itemId);
    loadCart();
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</p>
          <p className="text-gray-400 mb-8">Browse restaurants and add items to get started</p>
          <Link to="/restaurants" className="btn-primary px-8 py-3">Browse Restaurants</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            <div className="card p-4 bg-gray-50 border-0">
              <p className="text-sm font-medium text-gray-600">📍 From: <span className="text-gray-900 font-semibold">{cart.restaurant_name}</span></p>
            </div>
            {cart.items.map(item => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">₹{parseFloat(item.price).toFixed(0)} each</p>
                  {!item.is_available && <span className="text-xs text-red-500">Currently unavailable</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 font-bold text-gray-600 flex items-center justify-center">−</button>
                  <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 font-bold text-gray-600 flex items-center justify-center">+</button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold text-gray-900">₹{parseFloat(item.subtotal).toFixed(0)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="card p-6 sticky top-24">
              <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{parseFloat(cart.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery fee</span>
                  <span>{parseFloat(cart.delivery_fee) === 0 ? 'Free' : `₹${parseFloat(cart.delivery_fee).toFixed(2)}`}</span>
                </div>
                <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>₹{parseFloat(cart.total).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => navigate('/checkout')} className="btn-primary w-full py-3 text-base">
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
