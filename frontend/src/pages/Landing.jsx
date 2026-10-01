import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HOW_IT_WORKS = [
  { icon: '🍕', step: '1', title: 'Browse Restaurants', desc: 'Discover local restaurants near you. Filter by cuisine, explore menus and prices.' },
  { icon: '🛒', step: '2', title: 'Add to Cart', desc: 'Pick your favourite dishes, customize quantities, and review your order before checkout.' },
  { icon: '💳', step: '3', title: 'Quick Checkout', desc: 'Enter your address, select a payment method, and place your order in seconds.' },
  { icon: '🚴', step: '4', title: 'Track Your Order', desc: 'Watch your order progress in real time — from the kitchen to your doorstep.' },
];

const CUISINES = [
  { name: 'Italian', emoji: '🍝' }, { name: 'Indian', emoji: '🍛' },
  { name: 'American', emoji: '🍔' }, { name: 'Japanese', emoji: '🍱' },
  { name: 'Mexican', emoji: '🌮' }, { name: 'Chinese', emoji: '🥟' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-orange-50 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span></span>
            Now with AI Voice Ordering
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Local food, delivered<br />
            <span className="text-brand-500">fast & fresh</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Support local restaurants. Order online or just call our AI voice agent — it'll handle the rest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user?.role === 'customer' ? (
              <Link to="/restaurants" className="btn-primary text-base px-8 py-3">Browse Restaurants</Link>
            ) : user?.role === 'restaurant' ? (
              <Link to="/restaurant/dashboard" className="btn-primary text-base px-8 py-3">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/signup" className="btn-primary text-base px-8 py-3">Order Food →</Link>
                <Link to="/signup?role=restaurant" className="btn-secondary text-base px-8 py-3">Join as Restaurant</Link>
              </>
            )}
          </div>
          {/* Cuisine pills */}
          <div className="flex flex-wrap gap-3 justify-center mt-12">
            {CUISINES.map(c => (
              <Link key={c.name} to={`/restaurants?cuisine=${c.name}`} className="flex items-center gap-2 bg-white border border-gray-200 hover:border-brand-300 hover:shadow-sm px-4 py-2 rounded-full text-sm font-medium text-gray-700 transition-all">
                <span>{c.emoji}</span>{c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Order in four simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="text-center p-6">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Step {item.step}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Voice Ordering ── */}
      <section className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-500 bg-opacity-20 text-brand-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
                🎙️ AI-Powered
              </div>
              <h2 className="text-3xl font-bold mb-4">Order by voice — just call</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Too busy to type? Just dial our AI voice number. Our intelligent agent will take your order through a natural conversation, confirm the details, and place it automatically.
              </p>
              <div className="space-y-3">
                {[
                  'Natural conversation — no menus to navigate',
                  'Understands restaurant names & food items',
                  'Confirms your order before placing',
                  'Order appears instantly in your history',
                ].map(f => (
                  <div key={f} className="flex items-center gap-3 text-gray-300">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock conversation */}
            <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Sample conversation</div>
              {[
                { from: 'agent', text: "Hi! I'm LocalBite's AI ordering assistant. What would you like to order today?" },
                { from: 'user', text: "I want two chicken burgers from Burger Bliss." },
                { from: 'agent', text: "Got it — 2× Chicken Burger from Burger Bliss. What address should I deliver to?" },
                { from: 'user', text: "123 Main Street, Apartment 4B." },
                { from: 'agent', text: "Perfect. Shall I place the order?" },
                { from: 'user', text: "Yes, please!" },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.from === 'user' ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-gray-700 text-gray-200 rounded-bl-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For restaurants ── */}
      <section className="py-20 px-4 bg-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Partner with LocalBite</h2>
          <p className="text-gray-600 mb-10 max-w-xl mx-auto">Join local restaurants already growing with LocalBite. Get online orders, manage your menu, and track everything from a simple dashboard.</p>
          <div className="grid sm:grid-cols-3 gap-6 mb-10">
            {[
              { icon: '📊', title: 'Simple Dashboard', desc: 'Manage orders, menu, and analytics in one place.' },
              { icon: '🍽️', title: 'Easy Menu Management', desc: 'Add, edit, and toggle item availability instantly.' },
              { icon: '📱', title: 'Real-time Orders', desc: 'Accept and update orders as they come in.' },
            ].map(f => (
              <div key={f.title} className="card p-6 text-center">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
          <Link to="/signup?role=restaurant" className="btn-primary text-base px-8 py-3">Get Started — It's Free</Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍽️</span>
            <span className="font-bold text-white">LocalBite</span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link to="/restaurants" className="hover:text-white transition-colors">Browse</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link>
            <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <div className="text-xs">© 2024 LocalBite. Demo MVP.</div>
        </div>
      </footer>
    </div>
  );
}
