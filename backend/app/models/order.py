import uuid
from datetime import datetime, timezone
from app.extensions import db

class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(64), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False, index=True)
    amount_paise = db.Column(db.Integer, nullable=False) # In minor units (paise)
    currency = db.Column(db.String(10), nullable=False, default="INR")
    status = db.Column(db.String(20), nullable=False, default="pending", index=True) # "pending", "paid", "failed", "refunded"
    razorpay_order_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    razorpay_payment_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = db.relationship("User", back_populates="orders")
    course = db.relationship("Course", back_populates="orders")
    items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payments = db.relationship("Payment", back_populates="order", cascade="all, delete-orphan")
    enrollment = db.relationship("Enrollment", back_populates="order", uselist=False)

    @classmethod
    def generate_order_number(cls):
        return f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "course_id": self.course_id,
            "course_title": self.course.title if self.course else None,
            "course_slug": self.course.slug if self.course else None,
            "amount_paise": self.amount_paise,
            "amount_inr": round(self.amount_paise / 100, 2),
            "currency": self.currency,
            "status": self.status,
            "razorpay_order_id": self.razorpay_order_id,
            "razorpay_payment_id": self.razorpay_payment_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    price_paise = db.Column(db.Integer, nullable=False)

    order = db.relationship("Order", back_populates="items")
    course = db.relationship("Course")


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_gateway = db.Column(db.String(50), nullable=False, default="razorpay")
    gateway_payment_id = db.Column(db.String(100), unique=True, nullable=True, index=True)
    gateway_order_id = db.Column(db.String(100), nullable=True)
    gateway_signature = db.Column(db.String(255), nullable=True)
    amount_paise = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False) # "captured", "failed", "refunded"
    raw_response = db.Column(db.Text, nullable=True) # JSON debug/audit string
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    order = db.relationship("Order", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "order_id": self.order_id,
            "payment_gateway": self.payment_gateway,
            "gateway_payment_id": self.gateway_payment_id,
            "gateway_order_id": self.gateway_order_id,
            "amount_paise": self.amount_paise,
            "amount_inr": round(self.amount_paise / 100, 2),
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
