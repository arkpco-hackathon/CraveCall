from decimal import Decimal
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, User
from app.schemas import OrderCreate, OrderOut, VoiceOrderCreate, OrderStatusUpdate
from app.auth.dependencies import require_customer, require_restaurant, get_current_user
from app.services.order_service import (
    create_order_from_cart, create_order_from_voice,
    update_order_status, _build_order_out,
)
from app.services.pricing_service import calculate_order_totals
from app.config import settings

router = APIRouter(tags=["orders"])


class CouponValidateRequest(BaseModel):
    code: str
    subtotal: Decimal


# ── Customer: place order from cart ──────────────────────────────────────────

@router.post("/api/orders", status_code=201)
def place_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    order = create_order_from_cart(
        db=db,
        customer=current_user,
        delivery_address=payload.delivery_address,
        contact_phone=payload.contact_phone,
        payment_method=payload.payment_method,
        notes=payload.notes,
        coupon_code=payload.coupon_code,
    )
    return _build_order_out(order)


# ── Customer: order history ───────────────────────────────────────────────────

@router.get("/api/orders")
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    orders = (
        db.query(Order)
        .filter(Order.customer_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_order_out(o) for o in orders]


# ── Coupon Validation Preview ────────────────────────────────────────────────

@router.post("/api/coupons/validate")
def validate_coupon(
    payload: CouponValidateRequest,
    db: Session = Depends(get_db),
):
    pricing = calculate_order_totals(db=db, subtotal=payload.subtotal, coupon_code=payload.code)
    return {
        "valid": True,
        "code": pricing["coupon_code"],
        "subtotal": float(pricing["subtotal"]),
        "delivery_fee": float(pricing["delivery_fee"]),
        "discount": float(pricing["discount"]),
        "total": float(pricing["total"]),
    }


# ── Order detail (customer or restaurant) ─────────────────────────────────────

@router.get("/api/orders/{order_id}")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Access control
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "restaurant" and order.restaurant.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return _build_order_out(order)


# ── Restaurant: update status ─────────────────────────────────────────────────

@router.patch("/api/orders/{order_id}/status")
def update_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    order = update_order_status(db, order_id, payload.status, current_user)
    return _build_order_out(order)


# ── Voice order (n8n → FastAPI) ───────────────────────────────────────────────

@router.post("/api/orders/voice", status_code=201)
def voice_order(
    payload: VoiceOrderCreate,
    x_voice_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    # Validate API key
    if x_voice_api_key != settings.VOICE_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid voice API key")

    if not payload.confirmed:
        raise HTTPException(status_code=400, detail="Order was not confirmed by the customer")

    items_data = [{"name": item.name, "quantity": item.quantity} for item in payload.items]

    order = create_order_from_voice(
        db=db,
        customer_phone=payload.customer_phone,
        restaurant_name=payload.restaurant,
        items_data=items_data,
        delivery_address=payload.delivery_address,
        coupon_code=payload.coupon_code,
    )

    return {
        "success": True,
        "order_id": order.id,
        "subtotal": float(order.subtotal),
        "delivery_fee": float(order.delivery_fee),
        "discount": float(getattr(order, "discount", 0.0)),
        "total": float(order.total),
        "status": order.status,
        "source": order.source,
        "message": "Order placed successfully",
    }
