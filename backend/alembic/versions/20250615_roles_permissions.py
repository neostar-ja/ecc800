"""Add role, menu_items, role_menu_permissions, keycloak_config tables

Revision ID: 20250615_roles_permissions
Revises: 
Create Date: 2025-06-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = '20250615_roles_permissions'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create roles table
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(50), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('level', sa.Integer(), server_default='0'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_roles_id', 'roles', ['id'])
    op.create_index('ix_roles_name', 'roles', ['name'], unique=True)

    # Create menu_items table
    op.create_table(
        'menu_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('path', sa.String(255), nullable=False),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('order', sa.Integer(), server_default='0'),
        sa.Column('is_visible', sa.Boolean(), server_default='true'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['parent_id'], ['menu_items.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_menu_items_id', 'menu_items', ['id'])
    op.create_index('ix_menu_items_name', 'menu_items', ['name'], unique=True)

    # Create role_menu_permissions table
    op.create_table(
        'role_menu_permissions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('menu_item_id', sa.Integer(), nullable=False),
        sa.Column('can_view', sa.Boolean(), server_default='true'),
        sa.Column('can_edit', sa.Boolean(), server_default='false'),
        sa.Column('can_delete', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_role_menu_permissions_id', 'role_menu_permissions', ['id'])
    op.create_index(
        'idx_role_menu_unique', 
        'role_menu_permissions', 
        ['role_id', 'menu_item_id'], 
        unique=True
    )

    # Create keycloak_config table
    op.create_table(
        'keycloak_config',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('is_enabled', sa.Boolean(), server_default='false'),
        sa.Column('server_url', sa.String(500), nullable=True),
        sa.Column('realm', sa.String(100), nullable=True),
        sa.Column('client_id', sa.String(100), nullable=True),
        sa.Column('client_secret', sa.String(500), nullable=True),
        sa.Column('redirect_uri', sa.String(500), nullable=True),
        sa.Column('scope', sa.String(255), server_default="'openid profile email'"),
        sa.Column('admin_role', sa.String(100), server_default="'admin'"),
        sa.Column('editor_role', sa.String(100), server_default="'editor'"),
        sa.Column('viewer_role', sa.String(100), server_default="'viewer'"),
        sa.Column('default_role', sa.String(50), server_default="'viewer'"),
        sa.Column('auto_create_user', sa.Boolean(), server_default='true'),
        sa.Column('sync_user_info', sa.Boolean(), server_default='true'),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_keycloak_config_id', 'keycloak_config', ['id'])

    # Insert default roles
    op.execute("""
        INSERT INTO roles (name, display_name, description, level, is_active)
        VALUES 
            ('admin', 'Administrator', 'Full system access - can manage users, settings, and all data', 100, true),
            ('editor', 'Editor', 'Can view and edit data, but cannot manage users or system settings', 50, true),
            ('viewer', 'Viewer', 'Read-only access - can only view data', 10, true)
        ON CONFLICT (name) DO NOTHING;
    """)

    # Insert default menu items
    op.execute("""
        INSERT INTO menu_items (name, display_name, path, icon, "order", is_visible, description)
        VALUES 
            ('dashboard', 'Dashboard', '/', 'Dashboard', 1, true, 'Main dashboard with overview'),
            ('datacenter', 'Data Center', '/datacenter', 'Storage', 2, true, 'Data center visualization'),
            ('metrics', 'Metrics', '/metrics', 'Analytics', 3, true, 'Metrics and monitoring'),
            ('faults', 'Faults', '/faults', 'Warning', 4, true, 'Fault management'),
            ('power_cooling', 'Power & Cooling', '/power-cooling', 'Power', 5, true, 'Power and cooling monitoring'),
            ('work_orders', 'Work Orders', '/work-orders', 'Assignment', 6, true, 'Work order management'),
            ('reports', 'Reports', '/reports', 'Assessment', 7, true, 'Reports and analytics'),
            ('admin', 'Administration', '/admin', 'AdminPanelSettings', 100, true, 'System administration'),
            ('settings', 'Settings', '/settings', 'Settings', 101, true, 'System settings')
        ON CONFLICT (name) DO NOTHING;
    """)


def downgrade() -> None:
    op.drop_index('ix_keycloak_config_id', table_name='keycloak_config')
    op.drop_table('keycloak_config')
    
    op.drop_index('idx_role_menu_unique', table_name='role_menu_permissions')
    op.drop_index('ix_role_menu_permissions_id', table_name='role_menu_permissions')
    op.drop_table('role_menu_permissions')
    
    op.drop_index('ix_menu_items_name', table_name='menu_items')
    op.drop_index('ix_menu_items_id', table_name='menu_items')
    op.drop_table('menu_items')
    
    op.drop_index('ix_roles_name', table_name='roles')
    op.drop_index('ix_roles_id', table_name='roles')
    op.drop_table('roles')
