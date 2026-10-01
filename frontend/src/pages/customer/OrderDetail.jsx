import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';

const STEPS = [
  { key: 'PLACED', label: 'Order Placed', icon: '📋' },
  { key: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { key: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🛵' },
  { key: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

const STATUS_INDEX = { PLACED: 0, CONFIRMED: 1, PREPARING: 2, OUT_FOR_DELIVERY: 3, DELIVERED: 4 };

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = () => api.getOrder(id).then(setOrder).catch(console.error).finally(() => setLoading(false));
  useEffect(() => {
    loadOrder();
    // Poll every 10 seconds for status updates
    const interval = setInterval(loadOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  const currentStep = STATUS_INDEX[order.status] ?? -1;
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/orders" className="text-sm text-brand-500 hover:underline mb-1 block">← My Orders</Link>
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
          <p className="text-gray-500 text-sm">{order.restaurant_name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status tracker */}
      {!isCancelled ? (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-6">Order Progress</h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
            <div
              className="absolute left-5 top-5 w-0.5 bg-brand-500 transition-all duration-700"
              style={{ height: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
            <div className="space-y-6">
              {STEPS.map((step, i) => {
                const done = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step.key} className="relative flex items-center gap-4">
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 transition-all ${done ? 'bg-brand-500 border-brand-500' : 'bg-white border-gray-200'}`}>
                      {done ? <span className="text-white text-sm">{step.icon}</span> : <span className="text-gray-300 text-sm">{step.icon}</span>}
                    </div>
                    <div>
                      <p className={`font-semibold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      {active && <p className="text-xs text-brand-500 font-medium">● In progress</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-6 bg-red-50 border-red-200">
          <p className="text-red-700 font-semibold text-center">❌ Order Cancelled</p>
        </div>
      )}

      {/* Order details */}
      <div className="card p-6 mb-4">
        <h2 className="font-semibold text-gray-900 mb-3">Items</h2>
        <div className="space-y-2 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600">
              <span>{item.quantity}× {item.name}</span>
              <span>₹{parseFloat(item.subtotal).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500">
            <span>Subtotal</span><span>₹{parseFloat(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Delivery</span><span>₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
            <span>Total</span><span>₹{parseFloat(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card p-5 space-y-2 text-sm text-gray-600">
        <div className="flex gap-2"><span>📍</span><span>{order.delivery_address}</span></div>
        {order.contact_phone && <div className="flex gap-2"><span>📞</span><span>{order.contact_phone}</span></div>}
        <div className="flex gap-2">
          <span>💳</span>
          <span className="capitalize">{order.payment_method?.replace('_', ' ')} — {order.payment_status}</span>
        </div>
        {order.source === 'voice' && (
          <div className="flex gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-medium mt-1">
            <span>🎙️</span><span>Placed via AI Voice Order</span>
          </div>
        )}
        <div className="text-gray-400 text-xs pt-1">Ordered {new Date(order.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
}
