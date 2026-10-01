from pydantic import BaseModel
from typing import Optional
from decimal import Decimal
from datetime import datetime


class OrderItemOut(BaseModel):
    id: int
    menu_item_id: Optional[int] = None
    name: str
    price: Decimal
    quantity: int
    subtotal: Decimal

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    delivery_address: str
    contact_phone: Optional[str] = None
    payment_method: str  # 'demo_upi' | 'demo_card' | 'cash'
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    restaurant_name: str
    status: str
    delivery_address: str
    contact_phone: Optional[str] = None
    subtotal: Decimal
    delivery_fee: Decimal
    total: Decimal
    payment_method: Optional[str] = None
    payment_status: str
    source: str
    notes: Optional[str] = None
    items: list[OrderItemOut]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VoiceOrderItem(BaseModel):
    name: str
    quantity: int


class VoiceOrderCreate(BaseModel):
    customer_phone: str
    restaurant: str
    items: list[VoiceOrderItem]
    delivery_address: str
    confirmed: bool = True
    source: str = "voice"


class OrderStatusUpdate(BaseModel):
    status: str


class PaymentRequest(BaseModel):
    order_id: int
    method: str
    force_fail: bool = False
