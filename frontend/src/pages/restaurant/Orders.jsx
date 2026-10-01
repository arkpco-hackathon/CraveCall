import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const STATUS_ACTIONS = {
  PLACED:           { next: 'CONFIRMED',        label: 'Confirm Order', color: 'btn-primary' },
  CONFIRMED:        { next: 'PREPARING',         label: 'Start Preparing', color: 'btn-primary' },
  PREPARING:        { next: 'OUT_FOR_DELIVERY',  label: 'Out for Delivery', color: 'btn-primary' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED',         label: 'Mark Delivered', color: 'btn-primary' },
};

export default function RestaurantOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('active');

  const loadOrders = () => api.getRestaurantOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { loadOrders(); const iv = setInterval(loadOrders, 15000); return () => clearInterval(iv); }, []);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await api.updateOrderStatus(orderId, status);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const ACTIVE = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'];
  const filtered = filter === 'active'
    ? orders.filter(o => ACTIVE.includes(o.status))
    : filter === 'completed'
    ? orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status))
    : orders;

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[['active', `Active (${orders.filter(o => ACTIVE.includes(o.status)).length})`], ['all', 'All Orders'], ['completed', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${filter === v ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-10 text-center text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p>No {filter === 'active' ? 'active ' : ''}orders</p>
            </div>
          ) : filtered.map(order => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`card p-4 cursor-pointer transition-all hover:shadow-md ${selectedOrder?.id === order.id ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                    {order.source === 'voice' && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">🎙️ Voice</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{parseFloat(order.total).toFixed(0)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
              <p className="text-sm text-gray-600 truncate">{order.items.map(i => `${i.quantity}× ${i.name}`).join(', ')}</p>
              <p className="text-xs text-gray-400 mt-1 truncate">📍 {order.delivery_address}</p>

              {/* Quick action button */}
              {STATUS_ACTIONS[order.status] && (
                <button
                  onClick={(e) => { e.stopPropagation(); updateStatus(order.id, STATUS_ACTIONS[order.status].next); }}
                  disabled={updating === order.id}
                  className="mt-3 w-full btn-primary text-sm py-2"
                >
                  {updating === order.id ? 'Updating…' : STATUS_ACTIONS[order.status].label}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Order detail panel */}
        <div>
          {selectedOrder ? (
            <div className="card p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">Order #{selectedOrder.id}</h2>
                <StatusBadge status={selectedOrder.status} />
              </div>

              <div className="space-y-1 mb-4 text-sm text-gray-600">
                <div className="flex gap-2"><span>📍</span><span>{selectedOrder.delivery_address}</span></div>
                {selectedOrder.contact_phone && <div className="flex gap-2"><span>📞</span><span>{selectedOrder.contact_phone}</span></div>}
                {selectedOrder.notes && <div className="flex gap-2"><span>📝</span><span>{selectedOrder.notes}</span></div>}
                {selectedOrder.source === 'voice' && (
                  <div className="flex gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium mt-1">
                    <span>🎙️</span><span>Voice Order</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                <div className="space-y-1.5">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}× {item.name}</span>
                      <span className="font-medium text-gray-900">₹{parseFloat(item.subtotal).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{parseFloat(selectedOrder.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Delivery</span><span>₹{parseFloat(selectedOrder.delivery_fee).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100"><span>Total</span><span>₹{parseFloat(selectedOrder.total).toFixed(2)}</span></div>
              </div>

              {/* Status action button */}
              {STATUS_ACTIONS[selectedOrder.status] && (
                <button
                  onClick={() => updateStatus(selectedOrder.id, STATUS_ACTIONS[selectedOrder.status].next)}
                  disabled={updating === selectedOrder.id}
                  className="mt-5 w-full btn-primary py-3 text-base"
                >
                  {updating === selectedOrder.id ? 'Updating…' : STATUS_ACTIONS[selectedOrder.status].label}
                </button>
              )}
            </div>
          ) : (
            <div className="card p-10 text-center text-gray-400 sticky top-24">
              <div className="text-4xl mb-2">👆</div>
              <p>Select an order to see details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
