#!/bin/bash

# Initialize Login System - Roles, Menu Permissions, Keycloak Config
# Script to create database tables and default data

echo "=== ECC800 Login System Initialization ==="
echo ""

# Navigate to backend directory
cd /opt/code/ecc800/ecc800/backend

# Create tables directly using Python
echo "Creating database tables..."

python3 << 'EOF'
import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.models import Role, MenuItem, RoleMenuPermission, KeycloakConfig

async def create_tables():
    """Create tables directly using raw SQL"""
    
    async with engine.begin() as conn:
        # Create roles table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(50) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                description TEXT,
                level INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        print("✓ Created roles table")
        
        # Create menu_items table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                display_name VARCHAR(100) NOT NULL,
                path VARCHAR(255) NOT NULL,
                icon VARCHAR(50),
                parent_id INTEGER REFERENCES menu_items(id),
                "order" INTEGER DEFAULT 0,
                is_visible BOOLEAN DEFAULT true,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        print("✓ Created menu_items table")
        
        # Create role_menu_permissions table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS role_menu_permissions (
                id SERIAL PRIMARY KEY,
                role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
                menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
                can_view BOOLEAN DEFAULT true,
                can_edit BOOLEAN DEFAULT false,
                can_delete BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(role_id, menu_item_id)
            );
        """))
        print("✓ Created role_menu_permissions table")
        
        # Create keycloak_config table
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS keycloak_config (
                id SERIAL PRIMARY KEY,
                is_enabled BOOLEAN DEFAULT false,
                server_url VARCHAR(500),
                realm VARCHAR(100),
                client_id VARCHAR(100),
                client_secret VARCHAR(500),
                redirect_uri VARCHAR(500),
                scope VARCHAR(255) DEFAULT 'openid profile email',
                admin_role VARCHAR(100) DEFAULT 'admin',
                editor_role VARCHAR(100) DEFAULT 'editor',
                viewer_role VARCHAR(100) DEFAULT 'viewer',
                default_role VARCHAR(50) DEFAULT 'viewer',
                auto_create_user BOOLEAN DEFAULT true,
                sync_user_info BOOLEAN DEFAULT true,
                updated_by VARCHAR(50),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        print("✓ Created keycloak_config table")
        
        # Insert default roles
        await conn.execute(text("""
            INSERT INTO roles (name, display_name, description, level, is_active)
            VALUES 
                ('admin', 'Administrator', 'Full system access - can manage users, settings, and all data', 100, true),
                ('editor', 'Editor', 'Can view and edit data, but cannot manage users or system settings', 50, true),
                ('viewer', 'Viewer', 'Read-only access - can only view data', 10, true)
            ON CONFLICT (name) DO NOTHING;
        """))
        print("✓ Inserted default roles (admin, editor, viewer)")
        
        # Insert default menu items
        await conn.execute(text("""
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
        """))
        print("✓ Inserted default menu items")
        
        # Insert default permissions for each role
        # Admin: full access
        await conn.execute(text("""
            INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_edit, can_delete)
            SELECT r.id, m.id, true, true, true
            FROM roles r, menu_items m
            WHERE r.name = 'admin'
            ON CONFLICT (role_id, menu_item_id) DO NOTHING;
        """))
        print("✓ Set admin permissions (full access)")
        
        # Editor: view/edit most, no admin pages
        await conn.execute(text("""
            INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_edit, can_delete)
            SELECT r.id, m.id, 
                CASE WHEN m.name IN ('admin', 'settings') THEN false ELSE true END,
                CASE WHEN m.name IN ('admin', 'settings') THEN false ELSE true END,
                false
            FROM roles r, menu_items m
            WHERE r.name = 'editor'
            ON CONFLICT (role_id, menu_item_id) DO NOTHING;
        """))
        print("✓ Set editor permissions (view/edit except admin)")
        
        # Viewer: view only, no admin pages
        await conn.execute(text("""
            INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_edit, can_delete)
            SELECT r.id, m.id, 
                CASE WHEN m.name IN ('admin', 'settings') THEN false ELSE true END,
                false,
                false
            FROM roles r, menu_items m
            WHERE r.name = 'viewer'
            ON CONFLICT (role_id, menu_item_id) DO NOTHING;
        """))
        print("✓ Set viewer permissions (view only)")
        
        print("")
        print("=== Initialization Complete ===")
        print("Tables created: roles, menu_items, role_menu_permissions, keycloak_config")
        print("Default roles: Admin, Editor, Viewer")
        print("Default menu items: 9 items")
        print("Default permissions: configured for all roles")

asyncio.run(create_tables())
EOF

echo ""
echo "=== Done! ==="
