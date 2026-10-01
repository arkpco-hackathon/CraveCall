"""
Shared Order Service — used by BOTH web ordering and voice ordering.
All price calculation and validation lives here.
"""
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import User, Restaurant, MenuItem, Order, OrderItem, CartItem


VALID_STATUSES = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
STATUS_TRANSITIONS = {
    "PLACED": ["CONFIRMED", "CANCELLED"],
    "CONFIRMED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["OUT_FOR_DELIVERY", "CANCELLED"],
    "OUT_FOR_DELIVERY": ["DELIVERED"],
    "DELIVERED": [],
    "CANCELLED": [],
}


def _build_order_out(order: Order) -> dict:
    """Convert Order ORM object to dict for response."""
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "restaurant_id": order.restaurant_id,
        "restaurant_name": order.restaurant.name if order.restaurant else "",
        "status": order.status,
        "delivery_address": order.delivery_address,
        "contact_phone": order.contact_phone,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "total": order.total,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "source": order.source,
        "notes": order.notes,
        "items": [
            {
                "id": oi.id,
                "menu_item_id": oi.menu_item_id,
                "name": oi.name,
                "price": oi.price,
                "quantity": oi.quantity,
                "subtotal": oi.price * oi.quantity,
            }
            for oi in order.items
        ],
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def create_order_from_cart(
    db: Session,
    customer: User,
    delivery_address: str,
    contact_phone: str | None,
    payment_method: str,
    notes: str | None = None,
) -> Order:
    """Create an order from the customer's current cart (web ordering path)."""
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.customer_id == customer.id)
        .all()
    )
    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    # Determine restaurant from first cart item
    first_item = db.query(MenuItem).filter(MenuItem.id == cart_items[0].menu_item_id).first()
    restaurant_id = first_item.restaurant_id

    # Build items list: {menu_item_id, quantity}
    items = [{"menu_item_id": ci.menu_item_id, "quantity": ci.quantity} for ci in cart_items]

    order = _create_order(
        db=db,
        customer_id=customer.id,
        restaurant_id=restaurant_id,
        items=items,
        delivery_address=delivery_address,
        contact_phone=contact_phone or customer.phone,
        payment_method=payment_method,
        source="web",
        notes=notes,
    )

    # Clear cart after order
    db.query(CartItem).filter(CartItem.customer_id == customer.id).delete()
    db.commit()
    db.refresh(order)
    return order


def create_order_from_voice(
    db: Session,
    customer_phone: str,
    restaurant_name: str,
    items_data: list[dict],  # [{name, quantity}]
    delivery_address: str,
) -> Order:
    """Create an order from a VAPI voice call (voice ordering path)."""
    # Resolve customer by phone
    customer = db.query(User).filter(User.phone == customer_phone, User.role == "customer").first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No customer account found for phone {customer_phone}. Please sign up at our website.",
        )

    # Resolve restaurant by name (case-insensitive fuzzy match)
    restaurant = (
        db.query(Restaurant)
        .filter(Restaurant.name.ilike(f"%{restaurant_name}%"), Restaurant.is_active == True)
        .first()
    )
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Restaurant '{restaurant_name}' not found")

    # Resolve each item by name within the restaurant
    resolved_items = []
    for item_data in items_data:
        menu_item = (
            db.query(MenuItem)
            .filter(
                MenuItem.restaurant_id == restaurant.id,
                MenuItem.name.ilike(f"%{item_data['name']}%"),
            )
            .first()
        )
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Menu item '{item_data['name']}' not found at {restaurant.name}",
            )
        resolved_items.append({"menu_item_id": menu_item.id, "quantity": item_data["quantity"]})

    order = _create_order(
        db=db,
        customer_id=customer.id,
        restaurant_id=restaurant.id,
        items=resolved_items,
        delivery_address=delivery_address,
        contact_phone=customer.phone,
        payment_method="cash",  # voice orders default to cash
        source="voice",
    )
    db.commit()
    db.refresh(order)
    return order


def _create_order(
    db: Session,
    customer_id: int,
    restaurant_id: int,
    items: list[dict],  # [{menu_item_id, quantity}]
    delivery_address: str,
    contact_phone: str | None,
    payment_method: str,
    source: str,
    notes: str | None = None,
) -> Order:
    """
    Core order creation logic — shared between web and voice paths.
    Validates all items, fetches prices from DB, calculates totals.
    """
    # Validate restaurant
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id, Restaurant.is_active == True).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found or inactive")

    if not items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No items in order")

    subtotal = Decimal("0.00")
    order_items_data = []

    for item_req in items:
        menu_item_id = item_req["menu_item_id"]
        quantity = item_req["quantity"]

        if quantity < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be at least 1")

        # Fetch from DB — never trust client price
        menu_item = db.query(MenuItem).filter(MenuItem.id == menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Menu item {menu_item_id} not found")
        if menu_item.restaurant_id != restaurant_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Item '{menu_item.name}' does not belong to this restaurant")
        if not menu_item.is_available:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{menu_item.name}' is currently unavailable")

        item_total = menu_item.price * quantity
        subtotal += item_total
        order_items_data.append({
            "menu_item_id": menu_item.id,
            "name": menu_item.name,        # snapshot
            "price": menu_item.price,      # snapshot from DB
            "quantity": quantity,
        })

    delivery_fee = restaurant.delivery_fee
    total = subtotal + delivery_fee

    order = Order(
        customer_id=customer_id,
        restaurant_id=restaurant_id,
        status="PLACED",
        delivery_address=delivery_address,
        contact_phone=contact_phone,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        payment_method=payment_method,
        payment_status="PENDING",
        source=source,
        notes=notes,
    )
    db.add(order)
    db.flush()  # get order.id

    for oi_data in order_items_data:
        db.add(OrderItem(order_id=order.id, **oi_data))

    return order


def update_order_status(db: Session, order_id: int, new_status: str, restaurant_owner: User) -> Order:
    """Update order status — validates ownership and valid transition."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.restaurant.owner_id != restaurant_owner.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your restaurant's order")

    allowed = STATUS_TRANSITIONS.get(order.status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from {order.status} to {new_status}. Allowed: {allowed}",
        )

    order.status = new_status
    db.commit()
    db.refresh(order)
    return order
