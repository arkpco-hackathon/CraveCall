from decimal import Decimal
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.coupon import Coupon


def calculate_delivery_fee(subtotal: Decimal) -> Decimal:
    """
    Calculate order-value based delivery fee.
    - Subtotal >= ₹500 -> Free delivery
    - Subtotal >= ₹300 and < ₹500 -> ₹30 delivery fee
    - Subtotal < ₹300 -> ₹50 delivery fee
    """
    if subtotal >= Decimal("500.00"):
        return Decimal("0.00")
    elif subtotal >= Decimal("300.00"):
        return Decimal("30.00")
    else:
        return Decimal("50.00")


def validate_and_calculate_coupon(
    db: Session,
    coupon_code: Optional[str],
    subtotal: Decimal,
) -> Tuple[Decimal, Optional[str]]:
    """
    Validate coupon code and return (discount_amount, normalized_coupon_code).
    Raises HTTPException if coupon is invalid, inactive, or min order value not met.
    """
    if not coupon_code or not coupon_code.strip():
        return Decimal("0.00"), None

    code_clean = coupon_code.strip().upper()
    coupon = (
        db.query(Coupon)
        .filter(func.upper(Coupon.code) == code_clean, Coupon.is_active == True)
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or inactive coupon code '{coupon_code}'",
        )

    if subtotal < coupon.min_order_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Coupon '{coupon.code}' requires a minimum order subtotal of ₹{float(coupon.min_order_value):.2f}",
        )

    if coupon.discount_type == "PERCENTAGE":
        discount = (subtotal * coupon.discount_value) / Decimal("100.00")
        if coupon.max_discount is not None and discount > coupon.max_discount:
            discount = coupon.max_discount
    elif coupon.discount_type == "FIXED_AMOUNT":
        discount = coupon.discount_value
    else:
        discount = Decimal("0.00")

    # Discount cannot exceed subtotal
    if discount > subtotal:
        discount = subtotal

    # Round discount to 2 decimal places
    discount = discount.quantize(Decimal("0.01"))
    return discount, coupon.code


def calculate_order_totals(
    db: Session,
    subtotal: Decimal,
    coupon_code: Optional[str] = None,
) -> dict:
    """
    Centralized pricing calculation for orders.
    Calculates subtotal, delivery_fee, discount, total.
    """
    subtotal = subtotal.quantize(Decimal("0.01"))
    delivery_fee = calculate_delivery_fee(subtotal)
    discount, applied_coupon = validate_and_calculate_coupon(db, coupon_code, subtotal)
    total = subtotal + delivery_fee - discount

    if total < Decimal("0.00"):
        total = Decimal("0.00")

    return {
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "discount": discount,
        "total": total.quantize(Decimal("0.01")),
        "coupon_code": applied_coupon,
    }
