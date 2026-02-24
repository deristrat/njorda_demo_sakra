"""Seed the database with initial data."""

from sqlalchemy import select

from src.database import SessionLocal
from src.models import User

SEED_USERS = [
    {"username": "admin", "password": "admin", "role": "njorda_admin", "name": "Admin Njorda", "email": "admin@njorda.se"},
    {"username": "maria", "password": "demo", "role": "compliance", "name": "Maria Karlsson", "email": "maria@sakra.se"},
    {"username": "erik", "password": "demo", "role": "advisor", "name": "Erik Lindqvist", "email": "erik@sakra.se"},
    {"username": "anna", "password": "demo", "role": "advisor", "name": "Anna Svensson", "email": "anna@sakra.se"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        for u in SEED_USERS:
            existing = db.execute(
                select(User).where(User.username == u["username"])
            ).scalar_one_or_none()

            if existing:
                # Update role/name/email if changed
                existing.role = u["role"]
                existing.name = u["name"]
                existing.email = u["email"]
                existing.set_password(u["password"])
                print(f"Updated user '{u['username']}' (role={u['role']}).")
            else:
                user = User(
                    username=u["username"],
                    name=u["name"],
                    email=u["email"],
                    role=u["role"],
                )
                user.set_password(u["password"])
                db.add(user)
                print(f"Created user '{u['username']}' (role={u['role']}).")

        # Remove old 'demo' user if it exists and isn't one of the seed users
        seed_usernames = {u["username"] for u in SEED_USERS}
        old_demo = db.execute(
            select(User).where(User.username == "demo")
        ).scalar_one_or_none()
        if old_demo and old_demo.username not in seed_usernames:
            db.delete(old_demo)
            print("Removed old 'demo' user.")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
