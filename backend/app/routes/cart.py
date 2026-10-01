from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CartItem, User
from app.schemas import CartItemAdd, CartItemUpdate, CartOut
from app.auth.dependencies import require_customer
from app.services.cart_service import get_cart, add_to_cart

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=CartOut)
def get_my_cart(db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    return get_cart(db, current_user.id)


@router.post("/items", status_code=201)
def add_item(payload: CartItemAdd, db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    add_to_cart(db, current_user.id, payload.menu_item_id, payload.quantity)
    return get_cart(db, current_user.id)


@router.put("/items/{item_id}")
def update_item(
    item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_customer),
):
    cart_item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == current_user.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    if payload.quantity < 1:
        db.delete(cart_item)
    else:
        cart_item.quantity = payload.quantity
    db.commit()
    return get_cart(db, current_user.id)


@router.delete("/items/{item_id}", status_code=200)
def remove_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    cart_item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.customer_id == current_user.id).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(cart_item)
    db.commit()
    return get_cart(db, current_user.id)


@router.delete("", status_code=200)
def clear_cart(db: Session = Depends(get_db), current_user: User = Depends(require_customer)):
    db.query(CartItem).filter(CartItem.customer_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}
