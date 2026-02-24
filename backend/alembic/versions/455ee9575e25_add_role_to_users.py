"""add_role_to_users

Revision ID: 455ee9575e25
Revises: c4d5e6f7a8b9
Create Date: 2026-02-24 15:57:56.783407
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '455ee9575e25'
down_revision: Union[str, None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='advisor'))


def downgrade() -> None:
    op.drop_column('users', 'role')
