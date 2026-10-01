import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.getOrder(id).then(setOrder).catch(console.error).finally(() => setLoading(false)); }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!order) return <div className="text-center py-20 text-gray-500">Order not found</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed!</h1>
      <p className="text-gray-500 mb-8">Your order has been received and is being processed.</p>

      <div className="card p-6 text-left mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Order #{order.id}</p>
            <p className="font-bold text-gray-900 text-lg">{order.restaurant_name}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total</p>
            <p className="font-bold text-xl text-gray-900">₹{parseFloat(order.total).toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          {order.items.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600">
              <span>{item.quantity}× {item.name}</span>
              <span>₹{parseFloat(item.subtotal).toFixed(0)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>📍</span><span>{order.delivery_address}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>💳</span>
            <span className="capitalize">{order.payment_method?.replace('_', ' ')} — <span className={order.payment_status === 'SUCCESS' ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{order.payment_status}</span></span>
          </div>
          {order.source === 'voice' && (
            <div className="flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg mt-2 font-medium">
              <span>🎙️</span><span>Placed via AI Voice Order</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to={`/orders/${order.id}`} className="btn-primary px-8 py-3">Track Order →</Link>
        <Link to="/restaurants" className="btn-secondary px-8 py-3">Order More</Link>
      </div>
    </div>
  );
}
