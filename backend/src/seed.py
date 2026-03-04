"""Seed the database with initial data."""

from sqlalchemy import select

from src.database import SessionLocal
from src.models import User

SEED_USERS = [
    {"username": "admin", "password": "admin", "role": "njorda_admin", "name": "Admin Njorda", "email": "admin@njorda.se"},
    {"username": "maria", "password": "demo", "role": "compliance", "name": "Maria Karlsson", "email": "maria@sakra.se"},
    {"username": "johan", "password": "demo", "role": "advisor", "name": "Johan Berg", "email": "johan@sakra.se"},
    {"username": "karin", "password": "demo", "role": "advisor", "name": "Karin Ek", "email": "karin@sakra.se"},
    {"username": "anna", "password": "demo", "role": "advisor", "name": "Anna Lindgren", "email": "anna@sakra.se"},
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

        # Remove stale users not in the current seed set
        seed_usernames = {u["username"] for u in SEED_USERS}
        for stale_name in ["demo", "erik"]:
            stale = db.execute(
                select(User).where(User.username == stale_name)
            ).scalar_one_or_none()
            if stale and stale.username not in seed_usernames:
                db.delete(stale)
                print(f"Removed old '{stale_name}' user.")

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
