import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import LoadingSpinner from '../../components/LoadingSpinner';

const EMPTY_FORM = { name: '', description: '', price: '', category: '', is_available: true };

export default function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const r = await api.getMyRestaurant();
    setRestaurant(r);
    const m = await api.getMenu(r.id);
    setMenu(m);
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const set = (f) => (e) => setForm({ ...form, [f]: e.type === 'checkbox' ? e.target.checked : e.target.value });

  const openAdd = () => { setEditItem(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || '', price: String(item.price), category: item.category || '', is_available: item.is_available });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { setError('Name and price are required'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, price: parseFloat(form.price) };
      if (editItem) {
        await api.updateMenuItem(editItem.id, payload);
      } else {
        await api.addMenuItem(restaurant.id, payload);
      }
      await load();
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await api.deleteMenuItem(id);
    await load();
  };

  const handleToggle = async (id) => {
    await api.toggleAvailability(id);
    await load();
  };

  const categories = [...new Set(menu.map(i => i.category).filter(Boolean))];

  if (loading) return <LoadingSpinner size="lg" className="min-h-[60vh]" />;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name *</label>
                  <input type="text" required value={form.name} onChange={set('name')} placeholder="e.g. Butter Chicken" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (₹) *</label>
                  <input type="number" required min="0" step="0.01" value={form.price} onChange={set('price')} placeholder="299" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <input type="text" value={form.category} onChange={set('category')} placeholder="e.g. Mains, Starters" className="input-field" list="categories" />
                  <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea rows={2} value={form.description} onChange={set('description')} placeholder="Describe this dish…" className="input-field resize-none" />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <input type="checkbox" id="avail" checked={form.is_available} onChange={set('is_available')} className="w-4 h-4 accent-brand-500" />
                  <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available for ordering</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : editItem ? 'Save Changes' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500">{restaurant?.name} · {menu.length} items</p>
        </div>
        <button onClick={openAdd} className="btn-primary">+ Add Item</button>
      </div>

      {menu.length === 0 ? (
        <div className="text-center py-20 card">
          <div className="text-5xl mb-4">🍽️</div>
          <p className="text-lg font-medium text-gray-700 mb-2">No menu items yet</p>
          <p className="text-gray-400 mb-6">Add your first dish to start accepting orders</p>
          <button onClick={openAdd} className="btn-primary px-8 py-3">Add First Item</button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.length > 0 && (
            <>
              {categories.map(cat => {
                const items = menu.filter(i => i.category === cat);
                return (
                  <div key={cat} className="mb-6">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{cat}</h3>
                    <div className="space-y-2">
                      {items.map(item => <MenuItem key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />)}
                    </div>
                  </div>
                );
              })}
              {menu.filter(i => !i.category).map(item => <MenuItem key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />)}
            </>
          )}
          {categories.length === 0 && menu.map(item => <MenuItem key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggle} />)}
        </div>
      )}
    </div>
  );
}

function MenuItem({ item, onEdit, onDelete, onToggle }) {
  return (
    <div className={`card p-4 flex items-center gap-4 ${!item.is_available ? 'opacity-60' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-gray-900">{item.name}</span>
          {!item.is_available && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Unavailable</span>}
        </div>
        <p className="text-sm text-gray-500 truncate">{item.description}</p>
      </div>
      <span className="font-bold text-gray-900 text-base flex-shrink-0">₹{parseFloat(item.price).toFixed(0)}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onToggle(item.id)} title={item.is_available ? 'Disable' : 'Enable'}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${item.is_available ? 'bg-green-50 border-green-200 text-green-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600' : 'bg-red-50 border-red-200 text-red-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700'}`}>
          {item.is_available ? '✓ On' : '✗ Off'}
        </button>
        <button onClick={() => onEdit(item)} className="btn-secondary text-xs px-3 py-1.5">Edit</button>
        <button onClick={() => onDelete(item.id)} className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg font-semibold transition-colors">Delete</button>
      </div>
    </div>
  );
}
