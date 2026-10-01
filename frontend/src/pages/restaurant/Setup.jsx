import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

export default function RestaurantSetup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', cuisine: '', address: '', phone: '', delivery_fee: '30' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createRestaurant({ ...form, delivery_fee: parseFloat(form.delivery_fee) });
      navigate('/restaurant/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🏪</div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your restaurant</h1>
        <p className="text-gray-500 mt-1">Tell customers about your restaurant</p>
      </div>
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant Name *</label>
            <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. The Spice House" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine Type</label>
            <input type="text" value={form.cuisine} onChange={set('cuisine')} placeholder="e.g. Indian, Italian, Chinese…" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Tell customers what makes your restaurant special…" className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
            <input type="text" required value={form.address} onChange={set('address')} placeholder="Full restaurant address" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
            <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery Fee (₹)</label>
            <input type="number" min="0" step="0.01" value={form.delivery_fee} onChange={set('delivery_fee')} className="input-field" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
            {loading ? 'Creating…' : 'Create Restaurant Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
