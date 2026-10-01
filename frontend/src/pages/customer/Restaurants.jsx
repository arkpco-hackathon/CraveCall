import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const CUISINES = ['All', 'Italian', 'Indian', 'American', 'Japanese', 'Mexican'];

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cuisine, setCuisine] = useState('All');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const c = searchParams.get('cuisine');
    if (c) setCuisine(c);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (cuisine && cuisine !== 'All') params.cuisine = cuisine;
    api.getRestaurants(params)
      .then(setRestaurants)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, cuisine]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurants near you</h1>
        <p className="text-gray-500">Fresh food from local restaurants, delivered to your door</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text" placeholder="Search restaurants…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CUISINES.map(c => (
            <button
              key={c} onClick={() => setCuisine(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all ${cuisine === c ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : restaurants.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-lg font-medium">No restaurants found</p>
          <p className="text-sm mt-1">Try a different search or cuisine filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map(r => (
            <Link key={r.id} to={`/restaurants/${r.id}`} className="card overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-48 bg-gray-100 overflow-hidden">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between mb-1">
                  <h2 className="font-bold text-gray-900 text-lg">{r.name}</h2>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">{r.cuisine}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{r.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>📍 {r.address.split(',').slice(-2).join(',').trim()}</span>
                  <span className="font-medium text-gray-700">
                    {parseFloat(r.delivery_fee) === 0 ? '🆓 Free delivery' : `🛵 ₹${parseFloat(r.delivery_fee).toFixed(0)}`}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
