"""Add dashboard objects and templates tables only

Revision ID: b9196196b1b5
Revises: 001_equipment_overrides
Create Date: 2025-09-14 09:55:02.062836

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b9196196b1b5'
down_revision: Union[str, None] = '001_equipment_overrides'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create dashboard_objects table
    op.create_table(
        'dashboard_objects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('object_type', sa.String(), nullable=False),
        sa.Column('x_position', sa.Float(), nullable=False, server_default='0'),
        sa.Column('y_position', sa.Float(), nullable=False, server_default='0'),
        sa.Column('width', sa.Float(), nullable=False, server_default='100'),
        sa.Column('height', sa.Float(), nullable=False, server_default='100'),
        sa.Column('rotation', sa.Float(), nullable=False, server_default='0'),
        sa.Column('scale_x', sa.Float(), nullable=False, server_default='1'),
        sa.Column('scale_y', sa.Float(), nullable=False, server_default='1'),
        sa.Column('fill_color', sa.String(), server_default='#ffffff'),
        sa.Column('stroke_color', sa.String(), server_default='#000000'),
        sa.Column('stroke_width', sa.Float(), server_default='1'),
        sa.Column('opacity', sa.Float(), server_default='1'),
        sa.Column('text_content', sa.Text()),
        sa.Column('font_family', sa.String(), server_default='Arial'),
        sa.Column('font_size', sa.Float(), server_default='16'),
        sa.Column('font_style', sa.String(), server_default='normal'),
        sa.Column('image_url', sa.String()),
        sa.Column('z_index', sa.Integer(), server_default='1'),
        sa.Column('is_visible', sa.Boolean(), server_default='true'),
        sa.Column('is_draggable', sa.Boolean(), server_default='true'),
        sa.Column('data_center_id', sa.Integer()),
        sa.Column('equipment_id', sa.String()),
        sa.Column('properties', sa.JSON()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for dashboard_objects
    op.create_index('idx_dashboard_objects_type', 'dashboard_objects', ['object_type'])
    op.create_index('idx_dashboard_objects_visible', 'dashboard_objects', ['is_visible'])
    op.create_index('idx_dashboard_objects_datacenter_type', 'dashboard_objects', ['data_center_id', 'object_type'])
    
    # Create dashboard_templates table
    op.create_table(
        'dashboard_templates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('canvas_width', sa.Float(), server_default='1920'),
        sa.Column('canvas_height', sa.Float(), server_default='1080'),
        sa.Column('background_color', sa.String(), server_default='#ffffff'),
        sa.Column('background_image', sa.String()),
        sa.Column('is_default', sa.Boolean(), server_default='false'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('template_data', sa.JSON()),
        sa.Column('created_by', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    
    # Create indexes for dashboard_templates
    op.create_index('idx_dashboard_templates_name', 'dashboard_templates', ['name'])
    op.create_index('idx_dashboard_templates_is_default', 'dashboard_templates', ['is_default'])
    op.create_index('idx_dashboard_templates_is_active', 'dashboard_templates', ['is_active'])


def downgrade() -> None:
    # Drop dashboard_templates table
    op.drop_index('idx_dashboard_templates_is_active', 'dashboard_templates')
    op.drop_index('idx_dashboard_templates_is_default', 'dashboard_templates')
    op.drop_index('idx_dashboard_templates_name', 'dashboard_templates')
    op.drop_table('dashboard_templates')
    
    # Drop dashboard_objects table
    op.drop_index('idx_dashboard_objects_datacenter_type', 'dashboard_objects')
    op.drop_index('idx_dashboard_objects_visible', 'dashboard_objects')
    op.drop_index('idx_dashboard_objects_type', 'dashboard_objects')
    op.drop_table('dashboard_objects')
