"""Seed the database with initial data."""

from src.database import SessionLocal
from src.models import User


def seed() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == "demo").first()
        if existing:
            print("User 'demo' already exists, skipping.")
            return

        user = User(username="demo", name="Demo User", email="demo@njorda.se")
        user.set_password("demo")
        db.add(user)
        db.commit()
        print("Created user 'demo' with password 'demo'.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
