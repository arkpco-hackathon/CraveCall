from datetime import date
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Order, OrderItem, Restaurant, User
from app.auth.dependencies import require_restaurant, require_restaurant_owner
from app.services.order_service import _build_order_out, update_order_status
from app.schemas import OrderStatusUpdate

router = APIRouter(tags=["restaurant-dashboard"])


def _calculate_restaurant_analytics(db: Session, restaurant_id: int) -> dict:
    today = date.today()

    total_sales = db.query(func.sum(Order.total)).filter(
        Order.restaurant_id == restaurant_id,
        Order.status != "CANCELLED",
    ).scalar() or Decimal("0")

    today_sales = db.query(func.sum(Order.total)).filter(
        Order.restaurant_id == restaurant_id,
        Order.status != "CANCELLED",
        func.date(Order.created_at) == today,
    ).scalar() or Decimal("0")

    total_orders = db.query(Order).filter(Order.restaurant_id == restaurant_id).count()

    today_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        func.date(Order.created_at) == today,
    ).count()

    pending_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]),
    ).count()

    completed_orders = db.query(Order).filter(
        Order.restaurant_id == restaurant_id,
        Order.status.in_(["DELIVERED", "CANCELLED"]),
    ).count()

    # Popular items query
    popular_query = (
        db.query(
            OrderItem.name,
            func.sum(OrderItem.quantity).label("quantity_sold")
        )
        .join(Order, OrderItem.order_id == Order.id)
        .filter(
            Order.restaurant_id == restaurant_id,
            Order.status != "CANCELLED",
        )
        .group_by(OrderItem.name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    popular_items = [
        {"name": row[0], "quantity_sold": int(row[1])}
        for row in popular_query
    ]

    # Order status breakdown
    statuses = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
    order_status = {s: 0 for s in statuses}

    counts_query = (
        db.query(
            Order.status,
            func.count(Order.id)
        )
        .filter(Order.restaurant_id == restaurant_id)
        .group_by(Order.status)
        .all()
    )
    for st, cnt in counts_query:
        if st in order_status:
            order_status[st] = int(cnt)

    return {
        "today_sales": float(today_sales),
        "total_sales": float(total_sales),
        "today_orders": today_orders,
        "total_orders": total_orders,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "popular_items": popular_items,
        "order_status": order_status,
        # Keep backwards compatibility fields
        "active_orders": pending_orders,
        "total_revenue": float(total_sales),
        "today_revenue": float(today_sales),
    }


def _get_restaurant_orders_filtered(db: Session, restaurant_id: int, status_filter: Optional[str] = None) -> list:
    query = db.query(Order).filter(Order.restaurant_id == restaurant_id)
    if status_filter:
        s_upper = status_filter.upper()
        if s_upper == "PENDING":
            query = query.filter(Order.status.in_(["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY"]))
        elif s_upper == "COMPLETED":
            query = query.filter(Order.status.in_(["DELIVERED", "CANCELLED"]))
        else:
            query = query.filter(Order.status == s_upper)

    orders = query.order_by(Order.created_at.desc()).all()
    return [_build_order_out(o) for o in orders]


# ── Route endpoints ──────────────────────────────────────────────────────────

@router.get("/api/restaurant/orders")
def get_my_restaurant_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return []
    return _get_restaurant_orders_filtered(db, restaurant.id, status)


@router.get("/api/restaurants/{restaurant_id}/orders")
def get_restaurant_orders_by_id(
    restaurant_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    require_restaurant_owner(restaurant_id, db, current_user)
    return _get_restaurant_orders_filtered(db, restaurant_id, status)


@router.patch("/api/restaurants/{restaurant_id}/orders/{order_id}/status")
def update_restaurant_order_status_by_id(
    restaurant_id: int,
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    require_restaurant_owner(restaurant_id, db, current_user)
    order = update_order_status(db, order_id, payload.status, current_user)
    return _build_order_out(order)


@router.get("/api/restaurant/analytics")
def get_my_restaurant_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    restaurant = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not restaurant:
        return {
            "today_sales": 0, "total_sales": 0,
            "today_orders": 0, "total_orders": 0,
            "pending_orders": 0, "completed_orders": 0,
            "popular_items": [],
            "order_status": {"PLACED": 0, "CONFIRMED": 0, "PREPARING": 0, "OUT_FOR_DELIVERY": 0, "DELIVERED": 0, "CANCELLED": 0},
            "active_orders": 0, "total_revenue": 0, "today_revenue": 0,
        }
    return _calculate_restaurant_analytics(db, restaurant.id)


@router.get("/api/restaurants/{restaurant_id}/analytics")
def get_restaurant_analytics_by_id(
    restaurant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    require_restaurant_owner(restaurant_id, db, current_user)
    return _calculate_restaurant_analytics(db, restaurant_id)
