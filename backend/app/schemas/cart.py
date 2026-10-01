from pydantic import BaseModel
from typing import Optional
from decimal import Decimal


class CartItemAdd(BaseModel):
    menu_item_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemOut(BaseModel):
    id: int
    menu_item_id: int
    name: str
    price: Decimal
    quantity: int
    subtotal: Decimal
    restaurant_id: int
    restaurant_name: str
    image_url: Optional[str] = None
    is_available: bool

    class Config:
        from_attributes = True


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    restaurant_id: Optional[int] = None
    restaurant_name: Optional[str] = None
