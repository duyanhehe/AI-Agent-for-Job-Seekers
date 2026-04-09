import os
from sqlalchemy.orm import Session
from app.models.user import User
from app.services.auth.auth_service import AuthService


def sync_admin_account(db: Session):
    email = os.getenv("ADMIN_EMAIL")
    password = os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        return

    admin = db.query(User).filter(User.role == "admin").first()

    # ------------------------
    # Create if not exists
    # ------------------------
    if not admin:
        admin = User(
            email=email,
            password_hash=AuthService().hash_password(password),
            role="admin",
        )
        db.add(admin)
        db.commit()
        print(f"[INIT] Admin created: {email}")
        return

    updated = False

    # ------------------------
    # Update email if changed
    # ------------------------
    if admin.email != email:
        print(f"[INIT] Admin email updated: {admin.email} → {email}")
        admin.email = email
        updated = True

    # ------------------------
    # Update password if changed
    # ------------------------
    if not AuthService().verify_password(password, admin.password_hash):
        print("[INIT] Admin password updated")
        admin.password_hash = AuthService().hash_password(password)
        updated = True

    if updated:
        db.commit()
