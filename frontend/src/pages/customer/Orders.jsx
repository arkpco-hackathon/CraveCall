import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-lg font-medium text-gray-700 mb-2">No orders yet</p>
          <p className="text-gray-400 mb-8">Place your first order to see it here</p>
          <Link to="/restaurants" className="btn-primary px-8 py-3">Browse Restaurants</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link key={order.id} to={`/orders/${order.id}`} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-bold text-gray-900">{order.restaurant_name}</p>
                  {order.source === 'voice' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🎙️ Voice</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 truncate">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900 mb-1">₹{parseFloat(order.total).toFixed(2)}</p>
                <StatusBadge status={order.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
