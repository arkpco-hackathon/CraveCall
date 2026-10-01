import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_ACTIONS = {
  PLACED:           { next: 'CONFIRMED',        label: 'Confirm Order', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  CONFIRMED:        { next: 'PREPARING',         label: 'Start Preparing', color: 'bg-amber-600 hover:bg-amber-700 text-white' },
  PREPARING:        { next: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED',         label: 'Mark Delivered', color: 'bg-green-600 hover:bg-green-700 text-white' },
};

export default function RestaurantDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [r, a, o] = await Promise.all([
        api.getMyRestaurant(),
        api.getAnalytics(),
        api.getRestaurantOrders(),
      ]);
      setRestaurant(r);
      setAnalytics(a);
      setOrders(o);
    } catch (err) {
      if (err.message.includes('No restaurant profile')) navigate('/restaurant/setup');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  const pendingOrders = orders.filter(o => ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status));
  const completedOrders = orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const stats = [
    { label: "Today's Sales", value: `₹${(analytics?.today_sales ?? 0).toFixed(0)}`, icon: '💰', color: 'green' },
    { label: 'Total Orders', value: analytics?.total_orders ?? 0, icon: '📊', color: 'purple' },
    { label: 'Pending Orders', value: analytics?.pending_orders ?? pendingOrders.length, icon: '🔥', color: 'orange' },
    { label: 'Completed Orders', value: analytics?.completed_orders ?? completedOrders.length, icon: '✅', color: 'blue' },
  ];

  const colorMap = {
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Dashboard'}</h1>
          <p className="text-gray-500 text-sm">{restaurant?.cuisine} · {restaurant?.address?.split(',')[0]}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/restaurant/menu" className="btn-secondary text-sm">Manage Menu</Link>
          <Link to="/restaurant/orders" className="btn-primary text-sm">Order Management</Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5 border border-gray-100">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-xl mb-3 ${colorMap[stat.color]}`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Totals Overview */}
        <div className="card p-6 lg:col-span-1 flex flex-col justify-between">
          <h2 className="font-bold text-gray-900 mb-4 text-base">📊 Sales Overview</h2>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-xs text-green-700 font-semibold uppercase tracking-wider">Total Sales Revenue</p>
              <p className="text-2xl font-extrabold text-green-900 mt-1">₹{(analytics?.total_sales ?? 0).toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider">Today's Sales</p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">₹{(analytics?.today_sales ?? 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Popular Items */}
        <div className="card p-6 lg:col-span-1">
          <h2 className="font-bold text-gray-900 mb-4 text-base">🏆 Top Selling Items</h2>
          {analytics?.popular_items && analytics.popular_items.length > 0 ? (
            <div className="space-y-3">
              {analytics.popular_items.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-gray-800 truncate max-w-[160px]">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-gray-700">
                    {item.quantity_sold} sold
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic py-6 text-center">No sales data yet</p>
          )}
        </div>

        {/* Order Status Breakdown */}
        <div className="card p-6 lg:col-span-1">
          <h2 className="font-bold text-gray-900 mb-4 text-base">📈 Order Status Breakdown</h2>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {Object.entries(analytics?.order_status || {}).map(([st, cnt]) => (
              <div key={st} className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center">
                <p className="font-semibold text-gray-500 text-[11px] mb-0.5">{st}</p>
                <p className="text-lg font-bold text-gray-900">{cnt}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Orders Section */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-lg">🔥 Pending Orders</h2>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>
          <Link to="/restaurant/orders?filter=active" className="text-brand-500 text-sm hover:underline font-semibold">
            Manage all →
          </Link>
        </div>

        {pendingOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <p>No pending orders right now!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingOrders.map(order => (
              <div key={order.id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-base">Order #{order.id}</span>
                    {order.source === 'voice' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">🎙️ Voice Order</span>
                    )}
                    <span className="text-xs text-gray-400">
                      • {new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 font-medium truncate">
                    {order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}
                  </p>
                  <p className="text-xs text-gray-400 truncate">📍 {order.delivery_address}</p>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-lg">₹{parseFloat(order.total).toFixed(0)}</p>
                    <StatusBadge status={order.status} />
                  </div>

                  {STATUS_ACTIONS[order.status] && (
                    <button
                      onClick={() => handleStatusUpdate(order.id, STATUS_ACTIONS[order.status].next)}
                      disabled={updating === order.id}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${STATUS_ACTIONS[order.status].color}`}
                    >
                      {updating === order.id ? 'Updating…' : STATUS_ACTIONS[order.status].label}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Orders Section */}
      <div className="card">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-lg">✅ Completed Orders</h2>
            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
              {completedOrders.length}
            </span>
          </div>
        </div>

        {completedOrders.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p>No completed orders yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {completedOrders.slice(0, 10).map(order => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">Order #{order.id}</span>
                    {order.source === 'voice' && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🎙️ Voice</span>
                    )}
                    <span className="text-xs text-gray-400">
                      • {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">₹{parseFloat(order.total).toFixed(0)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
