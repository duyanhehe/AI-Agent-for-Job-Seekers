"""Admin users service."""

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User


class AdminUsersService:
    """Service for managing and retrieving user information."""

    @staticmethod
    def get_users(db: Session, skip: int = 0, limit: int = 100) -> dict:
        """
        Get paginated list of all users.

        Args:
            db: Database session
            skip: Number of records to skip
            limit: Number of records to return (max 100)

        Returns:
            dict: Paginated users with total count
        """
        # Cap the limit
        if limit > 100:
            limit = 100

        users = db.query(User).offset(skip).limit(limit).all()

        # Transform to response format
        users_data = [
            {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            }
            for user in users
        ]

        total = db.query(func.count(User.id)).scalar()

        return {
            "users": users_data,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
