from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MenuItem, User
from app.schemas import MenuItemCreate, MenuItemUpdate, MenuItemOut
from app.auth.dependencies import require_restaurant
from app.auth.dependencies import require_restaurant_owner

router = APIRouter(tags=["menu"])


@router.get("/api/restaurants/{restaurant_id}/menu", response_model=list[MenuItemOut])
def get_menu(restaurant_id: int, db: Session = Depends(get_db)):
    return db.query(MenuItem).filter(MenuItem.restaurant_id == restaurant_id).order_by(MenuItem.category, MenuItem.name).all()


@router.post("/api/restaurants/{restaurant_id}/menu", response_model=MenuItemOut, status_code=201)
def add_menu_item(
    restaurant_id: int,
    payload: MenuItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    require_restaurant_owner(restaurant_id, db, current_user)
    item = MenuItem(restaurant_id=restaurant_id, **payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/api/menu/{item_id}", response_model=MenuItemOut)
def update_menu_item(
    item_id: int,
    payload: MenuItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    require_restaurant_owner(item.restaurant_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/menu/{item_id}", status_code=204)
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    require_restaurant_owner(item.restaurant_id, db, current_user)
    db.delete(item)
    db.commit()


@router.patch("/api/menu/{item_id}/availability", response_model=MenuItemOut)
def toggle_availability(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    require_restaurant_owner(item.restaurant_id, db, current_user)
    item.is_available = not item.is_available
    db.commit()
    db.refresh(item)
    return item
