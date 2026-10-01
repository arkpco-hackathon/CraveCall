import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'restaurant' ? '/restaurant/dashboard' : '/restaurants');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: 'demo1234' });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your LocalBite account</p>
        </div>

        {/* Quick demo login buttons */}
        <div className="card p-4 mb-6 bg-amber-50 border-amber-200">
          <p className="text-xs font-semibold text-amber-700 mb-3 uppercase tracking-wide">Demo Accounts</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fillDemo('customer@demo.com')} className="text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-700 font-medium">
              👤 Customer
            </button>
            <button onClick={() => fillDemo('owner@burgerbliss.com')} className="text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-700 font-medium">
              🍔 Burger Bliss
            </button>
            <button onClick={() => fillDemo('owner@pizzapalace.com')} className="text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-700 font-medium">
              🍕 Pizza Palace
            </button>
            <button onClick={() => fillDemo('owner@spicegardens.com')} className="text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg hover:bg-amber-50 text-amber-700 font-medium">
              🍛 Spice Gardens
            </button>
          </div>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" required value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" required value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand-600 font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
