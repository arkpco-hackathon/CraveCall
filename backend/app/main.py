from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, SessionLocal
from app.models import Base  # noqa: F401 — import all models so create_all sees them
import app.models  # ensures all models are registered

from app.routes import (
    auth_router, restaurants_router, menu_router,
    cart_router, orders_router, restaurant_dash_router, payment_router,
)
from app.seed import seed_if_empty

app = FastAPI(
    title="Local Food Delivery API",
    description="Backend for the Local Food Delivery & Order Management System",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def startup():
    from app.database import Base
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(restaurants_router)
app.include_router(menu_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(restaurant_dash_router)
app.include_router(payment_router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "food-delivery-api"}
