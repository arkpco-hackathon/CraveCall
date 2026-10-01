import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RestaurantDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.getMyRestaurant(), api.getAnalytics(), api.getRestaurantOrders()])
      .then(([r, a, o]) => { setRestaurant(r); setAnalytics(a); setOrders(o); })
      .catch((err) => {
        if (err.message.includes('No restaurant profile')) navigate('/restaurant/setup');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  const activeOrders = orders.filter(o => ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status));
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: "Today's Orders", value: analytics?.today_orders ?? 0, icon: '📦', color: 'blue' },
    { label: "Today's Revenue", value: `₹${(analytics?.today_revenue ?? 0).toFixed(0)}`, icon: '💰', color: 'green' },
    { label: 'Active Orders', value: analytics?.active_orders ?? 0, icon: '🔥', color: 'orange' },
    { label: 'Total Orders', value: analytics?.total_orders ?? 0, icon: '📊', color: 'purple' },
  ];

  const colorMap = { blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', orange: 'bg-orange-50 text-orange-700', purple: 'bg-purple-50 text-purple-700' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Dashboard'}</h1>
          <p className="text-gray-500">{restaurant?.cuisine} · {restaurant?.address?.split(',')[0]}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/restaurant/menu" className="btn-secondary text-sm">Manage Menu</Link>
          <Link to="/restaurant/orders" className="btn-primary text-sm">View Orders</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ${colorMap[stat.color]}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Active orders banner */}
      {activeOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-semibold text-amber-800">{activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''} need attention</p>
              <p className="text-sm text-amber-600">Review and update order statuses</p>
            </div>
          </div>
          <Link to="/restaurant/orders" className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Manage →
          </Link>
        </div>
      )}

      {/* Recent orders */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Recent Orders</h2>
          <Link to="/restaurant/orders" className="text-brand-500 text-sm hover:underline">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>No orders yet. Share your restaurant to start receiving orders!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map(order => (
              <Link key={order.id} to={`/restaurant/orders`} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900">Order #{order.id}</span>
                    {order.source === 'voice' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🎙️ Voice</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900">₹{parseFloat(order.total).toFixed(0)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
