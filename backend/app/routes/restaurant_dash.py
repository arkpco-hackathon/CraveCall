from datetime import datetime, timezone, date
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Order, Restaurant, User
from app.auth.dependencies import require_restaurant
from app.services.order_service import _build_order_out

router = APIRouter(prefix="/api/restaurant", tags=["restaurant-dashboard"])


@router.get("/orders")
def get_restaurant_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return []
    orders = (
        db.query(Order)
        .filter(Order.restaurant_id == restaurant.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_order_out(o) for o in orders]


@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return {"total_orders": 0, "today_orders": 0, "active_orders": 0, "total_revenue": 0, "today_revenue": 0}

    today = date.today()

    total_orders = db.query(Order).filter(Order.restaurant_id == restaurant.id).count()
    today_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant.id,
        func.date(Order.created_at) == today,
    ).count()

    active_statuses = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]
    active_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant.id,
        Order.status.in_(active_statuses),
    ).count()

    total_revenue = db.query(func.sum(Order.total)).filter(
        Order.restaurant_id == restaurant.id,
        Order.payment_status == "SUCCESS",
    ).scalar() or Decimal("0")

    today_revenue = db.query(func.sum(Order.total)).filter(
        Order.restaurant_id == restaurant.id,
        Order.payment_status == "SUCCESS",
        func.date(Order.created_at) == today,
    ).scalar() or Decimal("0")

    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "active_orders": active_orders,
        "total_revenue": float(total_revenue),
        "today_revenue": float(today_revenue),
    }
