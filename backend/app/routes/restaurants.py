from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Restaurant, User
from app.schemas import RestaurantCreate, RestaurantUpdate, RestaurantOut
from app.auth.dependencies import get_current_user, require_restaurant
from app.auth.dependencies import require_restaurant_owner

router = APIRouter(tags=["restaurants"])


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/api/restaurants", response_model=list[RestaurantOut])
def list_restaurants(
    search: Optional[str] = None,
    cuisine: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Restaurant).filter(Restaurant.is_active == True)
    if search:
        query = query.filter(Restaurant.name.ilike(f"%{search}%"))
    if cuisine:
        query = query.filter(Restaurant.cuisine.ilike(f"%{cuisine}%"))
    return query.order_by(Restaurant.name).all()


@router.get("/api/restaurants/{restaurant_id}", response_model=RestaurantOut)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return r


# ── Restaurant management ─────────────────────────────────────────────────────

@router.post("/api/restaurants", response_model=RestaurantOut, status_code=201)
def create_restaurant(
    payload: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    if db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first():
        raise HTTPException(status_code=400, detail="You already have a restaurant. Please edit it instead.")
    restaurant = Restaurant(owner_id=current_user.id, **payload.model_dump())
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.put("/api/restaurants/{restaurant_id}", response_model=RestaurantOut)
def update_restaurant(
    restaurant_id: int,
    payload: RestaurantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    restaurant = require_restaurant_owner(restaurant_id, db, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(restaurant, field, value)
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.get("/api/restaurant/me", response_model=RestaurantOut)
def get_my_restaurant(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_restaurant),
):
    r = db.query(Restaurant).filter(Restaurant.owner_id == current_user.id).first()
    if not r:
        raise HTTPException(status_code=404, detail="No restaurant profile yet. Please create one.")
    return r
