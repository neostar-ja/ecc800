"""สร้างตาราง equipment_name_overrides และ view

Revision ID: 001_equipment_overrides
Revises: 
Create Date: 2025-08-28 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_equipment_overrides'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """สร้างตารางและ view สำหรับ equipment name overrides"""
    
    # สร้างตาราง equipment_name_overrides
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.equipment_name_overrides (
            id bigserial PRIMARY KEY,
            site_code text NOT NULL,
            equipment_id text NOT NULL,
            original_name text NOT NULL,
            display_name text NOT NULL,
            updated_by text,
            updated_at timestamptz DEFAULT now(),
            UNIQUE(site_code, equipment_id)
        );
    """)
    
    # สร้าง index สำหรับประสิทธิภาพ
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_equipment_overrides_site_equipment 
        ON public.equipment_name_overrides (site_code, equipment_id);
    """)
    
    # สร้าง view สำหรับ equipment display names
    op.execute("""
        CREATE OR REPLACE VIEW public.v_equipment_display_names AS
        SELECT 
            e.site_code,
            e.equipment_id,
            e.equipment_name AS original_name,
            COALESCE(o.display_name, e.equipment_name) AS display_name,
            e.location,
            e.building,
            e.room,
            e.vendor
        FROM public.performance_equipment_master e
        LEFT JOIN public.equipment_name_overrides o
        ON e.site_code = o.site_code AND e.equipment_id = o.equipment_id;
    """)
    
    # สร้างตารางสำหรับผู้ใช้ (ถ้ายังไม่มี)
    op.execute("""
        CREATE TABLE IF NOT EXISTS public.users (
            id bigserial PRIMARY KEY,
            username text UNIQUE NOT NULL,
            password_hash text NOT NULL,
            role text NOT NULL DEFAULT 'viewer',
            email text,
            full_name text,
            is_active boolean DEFAULT true,
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now()
        );
    """)
    
    # สร้าง index สำหรับผู้ใช้
    op.execute("""
        CREATE INDEX IF NOT EXISTS idx_users_username 
        ON public.users (username);
        
        CREATE INDEX IF NOT EXISTS idx_users_role 
        ON public.users (role);
    """)


def downgrade() -> None:
    """ลบตารางและ view"""
    
    op.execute("DROP VIEW IF EXISTS public.v_equipment_display_names;")
    op.execute("DROP TABLE IF EXISTS public.equipment_name_overrides;")
    op.execute("DROP TABLE IF EXISTS public.users;")
