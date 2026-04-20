"""Add allowed_users column to keycloak_config

Revision ID: add_allowed_users
Revises: 
Create Date: 2026-01-20
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = 'add_allowed_users'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add allowed_users column to keycloak_config
    op.add_column('keycloak_config', 
        sa.Column('allowed_users', JSONB, nullable=True, server_default='[]')
    )


def downgrade() -> None:
    op.drop_column('keycloak_config', 'allowed_users')
