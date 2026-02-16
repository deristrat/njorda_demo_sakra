"""add compliance tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-02-16 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Compliance rules table
    op.create_table(
        "compliance_rules",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("rule_type", sa.String(length=50), nullable=False),
        sa.Column("rule_params", JSONB(), nullable=True),
        sa.Column("document_types", JSONB(), nullable=True),
        sa.Column(
            "default_severity",
            sa.String(length=20),
            nullable=False,
            server_default="warning",
        ),
        sa.Column("severity_override", sa.String(length=20), nullable=True),
        sa.Column("max_deduction", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("remediation", sa.Text(), nullable=True),
        sa.Column("parent_rule_id", sa.String(length=50), nullable=True),
        sa.Column(
            "enabled", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("rule_id"),
        sa.ForeignKeyConstraint(
            ["parent_rule_id"],
            ["compliance_rules.rule_id"],
        ),
    )
    op.create_index("ix_compliance_rules_rule_id", "compliance_rules", ["rule_id"])

    # Compliance findings table
    op.create_table(
        "compliance_findings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("rule_id", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=10), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("tier", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("findings_json", JSONB(), nullable=True),
        sa.Column(
            "checked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_compliance_findings_document_id", "compliance_findings", ["document_id"]
    )

    # Denormalized compliance fields on documents
    op.add_column(
        "documents",
        sa.Column("compliance_status", sa.String(length=10), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("compliance_score", sa.Integer(), nullable=True),
    )
    op.add_column(
        "documents",
        sa.Column("compliance_summary", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("documents", "compliance_summary")
    op.drop_column("documents", "compliance_score")
    op.drop_column("documents", "compliance_status")
    op.drop_index(
        "ix_compliance_findings_document_id", table_name="compliance_findings"
    )
    op.drop_table("compliance_findings")
    op.drop_index("ix_compliance_rules_rule_id", table_name="compliance_rules")
    op.drop_table("compliance_rules")
