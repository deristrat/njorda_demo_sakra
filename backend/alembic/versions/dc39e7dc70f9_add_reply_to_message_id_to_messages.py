"""add reply_to_message_id to messages

Revision ID: dc39e7dc70f9
Revises: 43d18bb7912d
Create Date: 2026-03-05 14:09:50.638548
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dc39e7dc70f9'
down_revision: Union[str, None] = '43d18bb7912d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('messages', sa.Column('reply_to_message_id', sa.Integer(), nullable=True))
    op.create_index('ix_messages_reply_to_message_id', 'messages', ['reply_to_message_id'], unique=False)
    op.create_foreign_key('fk_messages_reply_to_message_id', 'messages', 'messages', ['reply_to_message_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint('fk_messages_reply_to_message_id', 'messages', type_='foreignkey')
    op.drop_index('ix_messages_reply_to_message_id', table_name='messages')
    op.drop_column('messages', 'reply_to_message_id')
