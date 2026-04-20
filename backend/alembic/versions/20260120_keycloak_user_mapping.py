"""Add keycloak_user_mapping table

Revision ID: 20260120_keycloak_user_mapping
Revises: 20250615_roles_permissions
Create Date: 2026-01-20

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers
revision = '20260120_keycloak_user_mapping'
down_revision = 'b9196196b1b5'
branch_labels = None
depends_on = None


def upgrade():
    # Create keycloak_user_mapping table
    op.create_table(
        'keycloak_user_mapping',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('keycloak_user_id', sa.String(255), nullable=False),
        sa.Column('keycloak_username', sa.String(255), nullable=False),
        sa.Column('keycloak_email', sa.String(255)),
        sa.Column('keycloak_full_name', sa.String(255)),
        sa.Column('local_role', sa.String(50), nullable=False),  # admin, editor, viewer
        sa.Column('is_enabled', sa.Boolean(), default=True),
        sa.Column('user_attributes', JSONB),  # Additional Keycloak user attributes
        sa.Column('created_by', sa.String(50)),
        sa.Column('updated_by', sa.String(50)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_keycloak_user_mapping_id', 'keycloak_user_mapping', ['id'])
    op.create_index('ix_keycloak_user_mapping_user_id', 'keycloak_user_mapping', ['keycloak_user_id'], unique=True)
    op.create_index('ix_keycloak_user_mapping_username', 'keycloak_user_mapping', ['keycloak_username'])


def downgrade():
    op.drop_index('ix_keycloak_user_mapping_username', table_name='keycloak_user_mapping')
    op.drop_index('ix_keycloak_user_mapping_user_id', table_name='keycloak_user_mapping')
    op.drop_index('ix_keycloak_user_mapping_id', table_name='keycloak_user_mapping')
    op.drop_table('keycloak_user_mapping')
