"""
Seed script — called once at application startup when DB is empty.
Creates demo accounts, restaurants, menu items, coupons, and historical orders.
"""
from decimal import Decimal
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import User, Restaurant, MenuItem, Order, OrderItem, Coupon
from app.auth.jwt import hash_password
from app.services.pricing_service import calculate_order_totals


DEMO_PASSWORD = "demo1234"


def seed_coupons_if_empty(db: Session) -> None:
    """Ensure demo coupons exist even if users were already seeded."""
    if db.query(Coupon).count() == 0:
        c1 = Coupon(
            code="WELCOME50",
            discount_type="PERCENTAGE",
            discount_value=Decimal("50.00"),
            min_order_value=Decimal("300.00"),
            max_discount=Decimal("50.00"),
            is_active=True,
        )
        c2 = Coupon(
            code="SAVE30",
            discount_type="FIXED_AMOUNT",
            discount_value=Decimal("30.00"),
            min_order_value=Decimal("250.00"),
            max_discount=None,
            is_active=True,
        )
        db.add_all([c1, c2])
        db.commit()
        print("🏷️  Demo coupons seeded (WELCOME50, SAVE30)")


def seed_if_empty(db: Session) -> None:
    seed_coupons_if_empty(db)

    if db.query(User).count() > 0:
        return  # Already seeded

    print("🌱 Seeding database with demo data...")

    # ── Customers ─────────────────────────────────────────────────────────────
    customer1 = User(
        email="customer@demo.com",
        password_hash=hash_password(DEMO_PASSWORD),
        full_name="Alex Johnson",
        phone="+910000000001",
        delivery_address="42 Elm Street, Apartment 3B, Mumbai 400001",
        role="customer",
    )
    customer2 = User(
        email="alice@demo.com",
        password_hash=hash_password(DEMO_PASSWORD),
        full_name="Alice Smith",
        phone="+910000000002",
        delivery_address="18 Park Avenue, Chennai 600001",
        role="customer",
    )

    # ── Restaurant owners ──────────────────────────────────────────────────────
    owner1 = User(email="owner@pizzapalace.com", password_hash=hash_password(DEMO_PASSWORD), full_name="Marco Rossi", phone="+911111111111", role="restaurant")
    owner2 = User(email="owner@spicegardens.com", password_hash=hash_password(DEMO_PASSWORD), full_name="Priya Sharma", phone="+911111111112", role="restaurant")
    owner3 = User(email="owner@burgerbliss.com", password_hash=hash_password(DEMO_PASSWORD), full_name="Jake Miller", phone="+911111111113", role="restaurant")
    owner4 = User(email="owner@sushisakura.com", password_hash=hash_password(DEMO_PASSWORD), full_name="Yuki Tanaka", phone="+911111111114", role="restaurant")
    owner5 = User(email="owner@tacetown.com", password_hash=hash_password(DEMO_PASSWORD), full_name="Carlos Mendez", phone="+911111111115", role="restaurant")

    db.add_all([customer1, customer2, owner1, owner2, owner3, owner4, owner5])
    db.flush()

    # ── Restaurants ────────────────────────────────────────────────────────────
    pizza_palace = Restaurant(
        owner_id=owner1.id, name="Pizza Palace", cuisine="Italian",
        description="Authentic Neapolitan pizzas baked in a wood-fired oven. Fresh ingredients, classic recipes.",
        address="12 Church Street, Bandra West, Mumbai 400050",
        phone="+912222222221", delivery_fee=Decimal("40.00"), is_active=True,
        image_url="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop",
    )
    spice_gardens = Restaurant(
        owner_id=owner2.id, name="Spice Gardens", cuisine="Indian",
        description="Authentic North and South Indian cuisine. Rich curries, tandoor delights, and biryani.",
        address="55 MG Road, Koramangala, Bangalore 560034",
        phone="+912222222222", delivery_fee=Decimal("25.00"), is_active=True,
        image_url="https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop",
    )
    burger_bliss = Restaurant(
        owner_id=owner3.id, name="Burger Bliss", cuisine="American",
        description="Gourmet burgers, crispy fries, and thick shakes. Locally sourced ingredients.",
        address="88 FC Road, Shivajinagar, Pune 411005",
        phone="+912222222223", delivery_fee=Decimal("30.00"), is_active=True,
        image_url="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop",
    )
    sushi_sakura = Restaurant(
        owner_id=owner4.id, name="Sushi Sakura", cuisine="Japanese",
        description="Premium sushi, sashimi, and ramen. Traditional Japanese flavors with modern presentation.",
        address="22 Nungambakkam High Road, Chennai 600034",
        phone="+912222222224", delivery_fee=Decimal("50.00"), is_active=True,
        image_url="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop",
    )
    taco_town = Restaurant(
        owner_id=owner5.id, name="Taco Town", cuisine="Mexican",
        description="Fresh Mexican street food — tacos, burritos, quesadillas, and zesty salsas.",
        address="31 Hauz Khas Village, New Delhi 110016",
        phone="+912222222225", delivery_fee=Decimal("35.00"), is_active=True,
        image_url="https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?w=800&auto=format&fit=crop",
    )

    db.add_all([pizza_palace, spice_gardens, burger_bliss, sushi_sakura, taco_town])
    db.flush()

    # ── Menu items ─────────────────────────────────────────────────────────────
    pizza_items = [
        MenuItem(restaurant_id=pizza_palace.id, name="Margherita Pizza", description="Classic tomato, mozzarella, fresh basil", price=Decimal("299.00"), category="Pizza", is_available=True),
        MenuItem(restaurant_id=pizza_palace.id, name="Pepperoni Pizza", description="Loaded with premium pepperoni and cheese", price=Decimal("399.00"), category="Pizza", is_available=True),
        MenuItem(restaurant_id=pizza_palace.id, name="BBQ Chicken Pizza", description="Smoky BBQ sauce, grilled chicken, red onion", price=Decimal("449.00"), category="Pizza", is_available=True),
        MenuItem(restaurant_id=pizza_palace.id, name="Four Cheese Pizza", description="Mozzarella, parmesan, gorgonzola, ricotta", price=Decimal("479.00"), category="Pizza", is_available=False),
        MenuItem(restaurant_id=pizza_palace.id, name="Garlic Bread", description="Toasted ciabatta with herb butter", price=Decimal("129.00"), category="Sides", is_available=True),
        MenuItem(restaurant_id=pizza_palace.id, name="Caesar Salad", description="Romaine, parmesan, croutons, Caesar dressing", price=Decimal("199.00"), category="Salads", is_available=True),
        MenuItem(restaurant_id=pizza_palace.id, name="Tiramisu", description="Classic Italian coffee dessert", price=Decimal("179.00"), category="Desserts", is_available=True),
    ]

    spice_items = [
        MenuItem(restaurant_id=spice_gardens.id, name="Butter Chicken", description="Tender chicken in rich tomato-cream sauce", price=Decimal("320.00"), category="Curries", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Paneer Tikka Masala", description="Grilled paneer in spiced tomato gravy", price=Decimal("280.00"), category="Curries", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Chicken Biryani", description="Fragrant basmati rice with spiced chicken", price=Decimal("350.00"), category="Biryani", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Vegetable Biryani", description="Aromatic basmati with seasonal vegetables", price=Decimal("280.00"), category="Biryani", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Dal Makhani", description="Slow-cooked black lentils in butter", price=Decimal("220.00"), category="Curries", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Garlic Naan", description="Soft leavened bread with garlic butter", price=Decimal("60.00"), category="Breads", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Gulab Jamun", description="Soft milk-solid dumplings in sugar syrup", price=Decimal("120.00"), category="Desserts", is_available=True),
        MenuItem(restaurant_id=spice_gardens.id, name="Lassi", description="Chilled yogurt drink — sweet or salted", price=Decimal("90.00"), category="Drinks", is_available=False),
    ]

    burger_items = [
        MenuItem(restaurant_id=burger_bliss.id, name="Classic Chicken Burger", description="Crispy fried chicken, lettuce, tomato, mayo", price=Decimal("249.00"), category="Burgers", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="BBQ Bacon Burger", description="Beef patty, crispy bacon, BBQ sauce, onion rings", price=Decimal("349.00"), category="Burgers", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Veggie Supreme", description="Black bean patty, avocado, cheese, salsa", price=Decimal("229.00"), category="Burgers", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Double Smash Burger", description="Two smashed beef patties, American cheese, pickles", price=Decimal("399.00"), category="Burgers", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Loaded Fries", description="Fries with cheese sauce, jalapenos, sour cream", price=Decimal("179.00"), category="Sides", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Onion Rings", description="Crispy beer-battered onion rings", price=Decimal("149.00"), category="Sides", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Chocolate Shake", description="Thick chocolate milkshake with whipped cream", price=Decimal("199.00"), category="Shakes", is_available=True),
        MenuItem(restaurant_id=burger_bliss.id, name="Chicken Wings", description="Buffalo wings with blue cheese dip", price=Decimal("299.00"), category="Sides", is_available=False),
    ]

    sushi_items = [
        MenuItem(restaurant_id=sushi_sakura.id, name="Salmon Nigiri (6 pcs)", description="Fresh Atlantic salmon on seasoned rice", price=Decimal("520.00"), category="Nigiri", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="California Roll (8 pcs)", description="Crab, avocado, cucumber, tobiko", price=Decimal("380.00"), category="Rolls", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Dragon Roll (8 pcs)", description="Shrimp tempura, avocado, eel sauce", price=Decimal("480.00"), category="Rolls", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Spicy Tuna Roll (8 pcs)", description="Fresh tuna, spicy mayo, cucumber", price=Decimal("420.00"), category="Rolls", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Chicken Ramen", description="Rich tonkotsu broth, chicken chashu, soft egg", price=Decimal("360.00"), category="Ramen", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Edamame", description="Steamed salted soybeans", price=Decimal("120.00"), category="Starters", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Miso Soup", description="Traditional miso with tofu and wakame", price=Decimal("90.00"), category="Soups", is_available=True),
        MenuItem(restaurant_id=sushi_sakura.id, name="Matcha Ice Cream", description="Japanese green tea ice cream", price=Decimal("160.00"), category="Desserts", is_available=False),
    ]

    taco_items = [
        MenuItem(restaurant_id=taco_town.id, name="Chicken Tacos (3 pcs)", description="Grilled chicken, salsa, guacamole, cheese", price=Decimal("249.00"), category="Tacos", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Beef Tacos (3 pcs)", description="Seasoned ground beef, pico de gallo, sour cream", price=Decimal("279.00"), category="Tacos", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Veggie Burrito", description="Black beans, rice, roasted veg, cheese, sour cream", price=Decimal("299.00"), category="Burritos", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Chicken Quesadilla", description="Grilled chicken, cheese, peppers in flour tortilla", price=Decimal("269.00"), category="Quesadillas", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Nachos Grande", description="Tortilla chips, cheese, jalapenos, guacamole, salsa", price=Decimal("229.00"), category="Starters", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Churros", description="Cinnamon sugar churros with chocolate dip", price=Decimal("159.00"), category="Desserts", is_available=True),
        MenuItem(restaurant_id=taco_town.id, name="Horchata", description="Chilled rice and cinnamon drink", price=Decimal("99.00"), category="Drinks", is_available=False),
    ]

    all_items = pizza_items + spice_items + burger_items + sushi_items + taco_items
    db.add_all(all_items)
    db.flush()

    # ── Historical orders ──────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)

    def make_order(customer, restaurant, items_data, status, source="web", days_ago=1, payment_method="demo_card", coupon_code=None):
        subtotal = sum(Decimal(str(p)) * q for _, p, q in items_data)
        pricing = calculate_order_totals(db=db, subtotal=subtotal, coupon_code=coupon_code)
        order = Order(
            customer_id=customer.id,
            restaurant_id=restaurant.id,
            status=status,
            delivery_address=customer.delivery_address or "123 Main Street",
            contact_phone=customer.phone,
            subtotal=pricing["subtotal"],
            delivery_fee=pricing["delivery_fee"],
            discount=pricing["discount"],
            total=pricing["total"],
            coupon_code=pricing["coupon_code"],
            payment_method=payment_method,
            payment_status="SUCCESS" if status != "CANCELLED" else "FAILED",
            source=source,
            created_at=now - timedelta(days=days_ago),
            updated_at=now - timedelta(days=days_ago),
        )
        return order, items_data

    historical = [
        make_order(customer1, burger_bliss, [("Classic Chicken Burger", 249, 2), ("Loaded Fries", 179, 1)], "DELIVERED", days_ago=7, coupon_code="WELCOME50"),
        make_order(customer1, pizza_palace, [("Margherita Pizza", 299, 1), ("Garlic Bread", 129, 1), ("Tiramisu", 179, 1)], "DELIVERED", days_ago=5, coupon_code="SAVE30"),
        make_order(customer1, spice_gardens, [("Butter Chicken", 320, 1), ("Garlic Naan", 60, 3)], "DELIVERED", days_ago=3),
        make_order(customer1, sushi_sakura, [("California Roll (8 pcs)", 380, 1), ("Edamame", 120, 1)], "DELIVERED", days_ago=2),
        make_order(customer1, taco_town, [("Chicken Tacos (3 pcs)", 249, 2), ("Nachos Grande", 229, 1)], "DELIVERED", days_ago=1),
        # Active orders (visible in restaurant dashboard)
        make_order(customer2, burger_bliss, [("BBQ Bacon Burger", 349, 1), ("Chocolate Shake", 199, 1)], "PLACED", days_ago=0, coupon_code="WELCOME50"),
        make_order(customer2, pizza_palace, [("Pepperoni Pizza", 399, 1), ("Caesar Salad", 199, 1)], "CONFIRMED", days_ago=0),
    ]

    for order_obj, items_data in historical:
        db.add(order_obj)
        db.flush()
        # Find the actual menu items by name within the restaurant
        for item_name, item_price, qty in items_data:
            oi = OrderItem(
                order_id=order_obj.id,
                name=item_name,
                price=Decimal(str(item_price)),
                quantity=qty,
            )
            db.add(oi)

    db.commit()
    print("✅ Seed complete. Demo credentials:")
    print("   Customer:   customer@demo.com / demo1234")
    print("   Restaurant: owner@burgerbliss.com / demo1234")
