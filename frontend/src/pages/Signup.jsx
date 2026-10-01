import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', phone: '',
    delivery_address: '', role: searchParams.get('role') || 'customer',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'restaurant' ? '/restaurant/setup' : '/restaurants');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Join LocalBite today</p>
        </div>

        <div className="card p-8">
          {/* Role toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
            {['customer', 'restaurant'].map(r => (
              <button
                key={r} type="button"
                onClick={() => setForm({ ...form, role: r })}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${form.role === r ? 'bg-brand-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {r === 'customer' ? '👤 Customer' : '🏪 Restaurant'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input type="text" required value={form.full_name} onChange={set('full_name')} placeholder="Alex Johnson" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input type="password" required value={form.password} onChange={set('password')} placeholder="Min. 6 characters" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number {form.role === 'customer' && <span className="text-brand-500">*</span>}
              </label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="input-field" required={form.role === 'customer'} />
              {form.role === 'customer' && <p className="text-xs text-gray-400 mt-1">Required for voice ordering via phone</p>}
            </div>
            {form.role === 'customer' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Delivery Address</label>
                <input type="text" value={form.delivery_address} onChange={set('delivery_address')} placeholder="42 Main Street, City 400001" className="input-field" />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base mt-2">
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
