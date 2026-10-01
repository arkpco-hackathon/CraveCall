import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RestaurantDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState(null);
  const [toast, setToast] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    Promise.all([api.getRestaurant(id), api.getMenu(id)])
      .then(([r, m]) => { setRestaurant(r); setMenu(m); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const categories = ['All', ...new Set(menu.map(i => i.category).filter(Boolean))];
  const filtered = activeCategory === 'All' ? menu : menu.filter(i => i.category === activeCategory);

  const addToCart = async (item) => {
    if (!user) { navigate('/login'); return; }
    setAddingItem(item.id);
    try {
      await api.addToCart({ menu_item_id: item.id, quantity: 1 });
      setToast(`${item.name} added to cart!`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {
      setToast(err.message);
      setTimeout(() => setToast(''), 3000);
    } finally {
      setAddingItem(null);
    }
  };

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;
  if (!restaurant) return <div className="text-center py-20 text-gray-500">Restaurant not found</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm font-medium transition-all">
          {toast}
        </div>
      )}

      {/* Restaurant header */}
      <div className="card overflow-hidden mb-8">
        {restaurant.image_url && (
          <div className="h-64 overflow-hidden">
            <img src={restaurant.image_url} alt={restaurant.name} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{restaurant.name}</h1>
                <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{restaurant.cuisine}</span>
              </div>
              <p className="text-gray-500 mb-2">{restaurant.description}</p>
              <p className="text-sm text-gray-400">📍 {restaurant.address}</p>
            </div>
            <div className="flex flex-col items-end gap-2 text-sm text-gray-600">
              <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                {parseFloat(restaurant.delivery_fee) === 0 ? '🆓 Free Delivery' : `🛵 Delivery fee: ₹${parseFloat(restaurant.delivery_fee).toFixed(0)}`}
              </div>
              {user && <button onClick={() => navigate('/cart')} className="btn-secondary text-sm px-4 py-2">View Cart 🛒</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {categories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeCategory === c ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}
            >{c}</button>
          ))}
        </div>
      )}

      {/* Menu items */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No items in this category</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={`card p-4 flex gap-4 ${!item.is_available ? 'opacity-60' : ''}`}>
              {item.image_url && (
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.category && <span className="text-xs text-gray-400">{item.category}</span>}
                  </div>
                  {!item.is_available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Unavailable</span>}
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900">₹{parseFloat(item.price).toFixed(0)}</span>
                  {item.is_available && (
                    <button
                      onClick={() => addToCart(item)}
                      disabled={addingItem === item.id}
                      className="btn-primary text-sm px-4 py-1.5"
                    >
                      {addingItem === item.id ? '…' : '+ Add'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
