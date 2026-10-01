from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import CartItem, MenuItem, Restaurant, User


def get_cart(db: Session, customer_id: int) -> dict:
    """Return enriched cart with totals."""
    items = db.query(CartItem).filter(CartItem.customer_id == customer_id).all()
    if not items:
        return {"items": [], "subtotal": Decimal("0"), "delivery_fee": Decimal("0"), "total": Decimal("0"), "restaurant_id": None, "restaurant_name": None}

    restaurant_id = items[0].menu_item.restaurant_id
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    delivery_fee = restaurant.delivery_fee if restaurant else Decimal("0")

    cart_items_out = []
    subtotal = Decimal("0")
    for ci in items:
        mi = ci.menu_item
        item_subtotal = mi.price * ci.quantity
        subtotal += item_subtotal
        cart_items_out.append({
            "id": ci.id,
            "menu_item_id": mi.id,
            "name": mi.name,
            "price": mi.price,
            "quantity": ci.quantity,
            "subtotal": item_subtotal,
            "restaurant_id": mi.restaurant_id,
            "restaurant_name": restaurant.name if restaurant else "",
            "image_url": mi.image_url,
            "is_available": mi.is_available,
        })

    return {
        "items": cart_items_out,
        "subtotal": subtotal,
        "delivery_fee": delivery_fee,
        "total": subtotal + delivery_fee,
        "restaurant_id": restaurant_id,
        "restaurant_name": restaurant.name if restaurant else None,
    }


def add_to_cart(db: Session, customer_id: int, menu_item_id: int, quantity: int) -> CartItem:
    """Add item to cart. Clears cart if item is from a different restaurant."""
    menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
    if not menu_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    if not menu_item.is_available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is currently unavailable")

    # Check if cart already has items from a different restaurant
    existing = db.query(CartItem).filter(CartItem.customer_id == customer_id).first()
    if existing:
        existing_restaurant_id = existing.menu_item.restaurant_id
        if existing_restaurant_id != menu_item.restaurant_id:
            # Clear cart — different restaurant
            db.query(CartItem).filter(CartItem.customer_id == customer_id).delete()
            db.flush()

    # Upsert
    cart_item = db.query(CartItem).filter(
        CartItem.customer_id == customer_id,
        CartItem.menu_item_id == menu_item_id,
    ).first()

    if cart_item:
        cart_item.quantity += quantity
    else:
        cart_item = CartItem(customer_id=customer_id, menu_item_id=menu_item_id, quantity=quantity)
        db.add(cart_item)

    db.commit()
    db.refresh(cart_item)
    return cart_item
