const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const err = await res.json();
      errorMsg = err.detail || err.message || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  register: (data) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/api/auth/me'),

  // Restaurants
  getRestaurants: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/restaurants${qs ? `?${qs}` : ''}`);
  },
  getRestaurant: (id) => request(`/api/restaurants/${id}`),
  createRestaurant: (data) => request('/api/restaurants', { method: 'POST', body: JSON.stringify(data) }),
  updateRestaurant: (id, data) => request(`/api/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMyRestaurant: () => request('/api/restaurant/me'),

  // Menu
  getMenu: (restaurantId) => request(`/api/restaurants/${restaurantId}/menu`),
  addMenuItem: (restaurantId, data) => request(`/api/restaurants/${restaurantId}/menu`, { method: 'POST', body: JSON.stringify(data) }),
  updateMenuItem: (id, data) => request(`/api/menu/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMenuItem: (id) => request(`/api/menu/${id}`, { method: 'DELETE' }),
  toggleAvailability: (id) => request(`/api/menu/${id}/availability`, { method: 'PATCH' }),

  // Cart
  getCart: () => request('/api/cart'),
  addToCart: (data) => request('/api/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  updateCartItem: (id, data) => request(`/api/cart/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeCartItem: (id) => request(`/api/cart/items/${id}`, { method: 'DELETE' }),
  clearCart: () => request('/api/cart', { method: 'DELETE' }),

  // Coupons
  validateCoupon: (code, subtotal) => request('/api/coupons/validate', { method: 'POST', body: JSON.stringify({ code, subtotal }) }),

  // Orders
  placeOrder: (data) => request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => request('/api/orders'),
  getOrder: (id) => request(`/api/orders/${id}`),

  // Restaurant dashboard
  getRestaurantOrders: (status) => request(`/api/restaurant/orders${status ? `?status=${status}` : ''}`),
  updateOrderStatus: (id, status) => request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAnalytics: () => request('/api/restaurant/analytics'),

  // Payment
  demoPayment: (data) => request('/api/payment/demo', { method: 'POST', body: JSON.stringify(data) }),
};
