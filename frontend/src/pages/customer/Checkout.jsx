import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const PAYMENT_METHODS = [
  { id: 'demo_upi', label: 'Demo UPI', icon: '📱', desc: 'Simulated UPI payment' },
  { id: 'demo_card', label: 'Demo Card', icon: '💳', desc: 'Simulated card payment' },
  { id: 'cash', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
];

export default function Checkout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false); // show payment modal
  const [form, setForm] = useState({ delivery_address: '', contact_phone: '', payment_method: 'demo_upi', notes: '' });
  const [error, setError] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discount, delivery_fee, total }
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    api.getCart().then(c => {
      setCart(c);
      setForm(f => ({
        ...f,
        delivery_address: user?.delivery_address || '',
        contact_phone: user?.phone || '',
      }));
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const subtotal = cart ? parseFloat(cart.subtotal) : 0;

  // Delivery fee rules: >=500 free, >=300 30, <300 50
  const deliveryFee = appliedCoupon ? appliedCoupon.delivery_fee : (subtotal >= 500 ? 0 : subtotal >= 300 ? 30 : 50);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const grandTotal = appliedCoupon ? appliedCoupon.total : (subtotal + deliveryFee - discount);

  const handleApplyCoupon = async (e) => {
    if (e) e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponLoading(true);

    try {
      const result = await api.validateCoupon(couponCode, subtotal);
      setAppliedCoupon(result);
      setCouponError('');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.delivery_address.trim()) { setError('Delivery address is required'); return; }
    setError('');
    setPlacing(true);

    try {
      const orderPayload = {
        ...form,
        coupon_code: appliedCoupon ? appliedCoupon.code : (couponCode.trim() || null),
      };

      // 1. Place order
      const order = await api.placeOrder(orderPayload);

      // 2. If UPI or Card — simulate payment
      if (form.payment_method !== 'cash') {
        setPaymentStep(true);
        await api.demoPayment({ order_id: order.id, method: form.payment_method });
        setPaymentStep(false);
      }

      navigate(`/order-confirmation/${order.id}`);
    } catch (err) {
      setPaymentStep(false);
      setError(err.message);
      setPlacing(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Payment processing modal */}
      {paymentStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 text-center max-w-sm w-full mx-4">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Demo Payment</h2>
            <p className="text-gray-500 text-sm mb-6">This is a simulated payment for demonstration purposes</p>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-4 py-2 rounded-full mb-6">
              ⚠️ DEMO PAYMENT — No real money charged
            </div>
            <LoadingSpinner size="md" />
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handlePlaceOrder} className="lg:col-span-2 space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

          {/* Delivery info */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-4">Delivery Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Address *</label>
                <input type="text" required value={form.delivery_address} onChange={set('delivery_address')} placeholder="Enter full delivery address" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Phone</label>
                <input type="tel" value={form.contact_phone} onChange={set('contact_phone')} placeholder="+91 98765 43210" className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Special Instructions (optional)</label>
                <textarea rows={2} value={form.notes} onChange={set('notes')} placeholder="E.g. Leave at door, no spice, etc." className="input-field resize-none" />
              </div>
            </div>
          </div>

          {/* Coupon input */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-3">Coupons & Offers</h2>
            {appliedCoupon ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 font-bold text-sm">🎉 {appliedCoupon.code} Applied</span>
                  </div>
                  <p className="text-xs text-green-700 mt-0.5">You saved ₹{appliedCoupon.discount.toFixed(2)} on this order!</p>
                </div>
                <button type="button" onClick={handleRemoveCoupon} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code (e.g. WELCOME50)"
                    className="input-field uppercase flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-secondary px-5 text-sm font-semibold"
                  >
                    {couponLoading ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}

                {/* Hints */}
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => { setCouponCode('WELCOME50'); }}
                    className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-md hover:bg-orange-100 transition-colors"
                  >
                    🎟️ <strong>WELCOME50</strong> (50% off min ₹300)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCouponCode('SAVE30'); }}
                    className="bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-md hover:bg-purple-100 transition-colors"
                  >
                    🏷️ <strong>SAVE30</strong> (₹30 off min ₹250)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="card p-6">
            <h2 className="font-bold text-gray-900 mb-1">Payment Method</h2>
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
              ⚠️ DEMO PAYMENT — No real charges
            </div>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => (
                <label key={m.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === m.id ? 'border-brand-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value={m.id} checked={form.payment_method === m.id} onChange={set('payment_method')} className="sr-only" />
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{m.label}</p>
                    <p className="text-xs text-gray-500">{m.desc}</p>
                  </div>
                  {form.payment_method === m.id && <span className="ml-auto text-brand-500 text-lg">✓</span>}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" disabled={placing} className="btn-primary w-full py-4 text-base">
            {placing ? 'Placing order…' : `Place Order — ₹${grandTotal.toFixed(2)}`}
          </button>
        </form>

        {/* Order summary */}
        <div>
          <div className="card p-6 sticky top-24">
            <h2 className="font-bold text-gray-900 mb-4">Order Summary</h2>
            <p className="text-sm text-gray-500 mb-3 font-medium">{cart.restaurant_name}</p>
            <div className="space-y-2 mb-4">
              {cart.items.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span className="flex-1 truncate">{item.quantity}× {item.name}</span>
                  <span className="ml-2 font-medium">₹{parseFloat(item.subtotal).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong className="text-green-600">FREE</strong> : `₹${deliveryFee.toFixed(2)}`}</span>
              </div>
              {subtotal < 500 && (
                <p className="text-[11px] text-gray-400 italic">
                  Add ₹{(500 - subtotal).toFixed(0)} more for FREE delivery
                </p>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
                <span>Total</span><span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
