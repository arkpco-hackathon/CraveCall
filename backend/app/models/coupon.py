from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Numeric, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    discount_type: Mapped[str] = mapped_column(String(20), nullable=False)  # PERCENTAGE or FIXED_AMOUNT
    discount_value: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False)
    min_order_value: Mapped[Decimal] = mapped_column(Numeric(8, 2), nullable=False, default=0)
    max_discount: Mapped[Decimal | None] = mapped_column(Numeric(8, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
