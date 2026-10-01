import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Order, User
from app.schemas import PaymentRequest
from app.auth.dependencies import require_customer
from app.services.order_service import _build_order_out

router = APIRouter(prefix="/api/payment", tags=["payment"])


@router.post("/demo")
async def demo_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    """Simulated demo payment — no real payment processing."""
    order = db.query(Order).filter(Order.id == payload.order_id, Order.customer_id == current_user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_status == "SUCCESS":
        return {"success": True, "message": "Payment already processed", "order": _build_order_out(order)}

    # Simulate processing delay
    await asyncio.sleep(1.5)

    if payload.force_fail:
        order.payment_status = "FAILED"
        db.commit()
        raise HTTPException(status_code=402, detail="Demo payment failed (simulated)")

    order.payment_method = payload.method
    order.payment_status = "SUCCESS"
    db.commit()
    db.refresh(order)

    return {"success": True, "message": "Demo payment successful", "order": _build_order_out(order)}
