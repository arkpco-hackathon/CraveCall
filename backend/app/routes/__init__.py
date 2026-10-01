from app.routes.auth import router as auth_router
from app.routes.restaurants import router as restaurants_router
from app.routes.menu import router as menu_router
from app.routes.cart import router as cart_router
from app.routes.orders import router as orders_router
from app.routes.restaurant_dash import router as restaurant_dash_router
from app.routes.payment import router as payment_router

__all__ = [
    "auth_router", "restaurants_router", "menu_router",
    "cart_router", "orders_router", "restaurant_dash_router", "payment_router",
]
