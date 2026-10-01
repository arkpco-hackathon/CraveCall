from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine: Optional[str] = None
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    delivery_fee: Optional[Decimal] = Decimal("0.00")


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    image_url: Optional[str] = None
    delivery_fee: Optional[Decimal] = None
    is_active: Optional[bool] = None


class RestaurantOut(BaseModel):
    id: int
    owner_id: int
    name: str
    description: Optional[str] = None
    cuisine: Optional[str] = None
    address: str
    phone: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool
    delivery_fee: Decimal
    created_at: datetime

    class Config:
        from_attributes = True
