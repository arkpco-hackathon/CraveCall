from datetime import datetime
from decimal import Decimal

from sqlalchemy import String, Boolean, ForeignKey, Numeric, Text, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cuisine: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(8, 2), default=0.00)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="restaurant")
    menu_items: Mapped[list["MenuItem"]] = relationship("MenuItem", back_populates="restaurant", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="restaurant")
