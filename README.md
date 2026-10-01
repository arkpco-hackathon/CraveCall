# LocalBite — Local Food Delivery MVP

A full-stack food delivery platform with AI voice ordering.

## Quick Start

### 1. Start the backend (Docker)

```bash
# From project root
docker compose up --build
```

Backend available at: http://localhost:8000  
API docs at: http://localhost:8000/docs

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend available at: http://localhost:5173

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | demo1234 |
| Customer | alice@demo.com | demo1234 |
| Restaurant (Burger Bliss) | owner@burgerbliss.com | demo1234 |
| Restaurant (Pizza Palace) | owner@pizzapalace.com | demo1234 |
| Restaurant (Spice Gardens) | owner@spicegardens.com | demo1234 |
| Restaurant (Sushi Sakura) | owner@sushisakura.com | demo1234 |
| Restaurant (Taco Town) | owner@tacetown.com | demo1234 |

---

## Architecture

```
React/Vite (localhost:5173)
      ↓
FastAPI (localhost:8000)
      ↓
PostgreSQL (Docker, localhost:5432)
```

Voice ordering:
```
Customer → VAPI phone call → n8n webhook → POST /api/orders/voice → FastAPI → PostgreSQL
```

---

## API Documentation

Interactive API docs: http://localhost:8000/docs

### Key Endpoints

- `POST /api/auth/register` — Sign up
- `POST /api/auth/login` — Login
- `GET /api/restaurants` — Browse restaurants
- `GET /api/restaurants/{id}/menu` — View menu
- `POST /api/cart/items` — Add to cart
- `POST /api/orders` — Place order
- `POST /api/orders/voice` — Voice order (n8n → FastAPI)
- `PATCH /api/orders/{id}/status` — Update order status
- `GET /api/restaurant/analytics` — Restaurant stats

---

## Voice Order Payload (n8n → FastAPI)

```
POST /api/orders/voice
Header: X-Voice-Api-Key: voice_secret_key_change_me_2024

{
  "customer_phone": "+910000000001",
  "restaurant": "Burger Bliss",
  "items": [
    { "name": "Classic Chicken Burger", "quantity": 2 }
  ],
  "delivery_address": "123 Main Street",
  "confirmed": true,
  "source": "voice"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and update values for production.
