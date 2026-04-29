"""Create electricity rate and cost tables

Revision ID: 20260428_electricity_cost
Revises: add_allowed_users_20260120155144
Create Date: 2026-04-28 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '20260428_electricity_cost'
down_revision = 'add_allowed_users_20260120155144'
branch_labels = None
depends_on = None


def upgrade():
    """Create electricity_rates and electricity_costs tables"""
    
    # Create electricity_rates table
    op.create_table(
        'electricity_rates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data_center_id', sa.Integer(), nullable=False),
        sa.Column('site_code', sa.String(10), nullable=False),
        sa.Column('rate_value', sa.Numeric(10, 4), nullable=False),
        sa.Column('rate_unit', sa.String(20), server_default='Baht/kWh', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('effective_from', sa.DateTime(timezone=True), nullable=False),
        sa.Column('effective_to', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['data_center_id'], ['data_centers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for electricity_rates
    op.create_index('idx_electricity_rate_dc_active', 'electricity_rates', ['data_center_id', 'is_active'])
    op.create_index('idx_electricity_rate_effective', 'electricity_rates', ['effective_from', 'effective_to'])
    op.create_index('idx_electricity_rate_site_code', 'electricity_rates', ['site_code'])
    
    # Create electricity_costs table
    op.create_table(
        'electricity_costs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('data_center_id', sa.Integer(), nullable=False),
        sa.Column('site_code', sa.String(10), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('month_start', sa.DateTime(timezone=True), nullable=False),
        sa.Column('month_end', sa.DateTime(timezone=True), nullable=False),
        sa.Column('total_energy_kwh', sa.Numeric(15, 2), server_default='0', nullable=False),
        sa.Column('average_rate', sa.Numeric(10, 4), server_default='0', nullable=False),
        sa.Column('total_cost_baht', sa.Numeric(15, 2), server_default='0', nullable=False),
        sa.Column('days_in_period', sa.Integer(), server_default='0', nullable=False),
        sa.Column('avg_daily_energy_kwh', sa.Numeric(12, 2), server_default='0', nullable=False),
        sa.Column('peak_hour_energy_kwh', sa.Numeric(12, 2), server_default='0', nullable=False),
        sa.Column('is_finalized', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('calculation_method', sa.String(50), server_default='automatic', nullable=False),
        sa.Column('created_by', sa.String(50), nullable=True),
        sa.Column('updated_by', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['data_center_id'], ['data_centers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create unique index for electricity_costs (data_center_id, year, month)
    op.create_index('idx_electricity_cost_dc_month', 'electricity_costs', ['data_center_id', 'year', 'month'], unique=True)
    op.create_index('idx_electricity_cost_period', 'electricity_costs', ['month_start', 'month_end'])
    op.create_index('idx_electricity_cost_finalized', 'electricity_costs', ['is_finalized'])
    op.create_index('idx_electricity_cost_site_code', 'electricity_costs', ['site_code'])


def downgrade():
    """Drop electricity_rates and electricity_costs tables"""
    
    # Drop indexes
    op.drop_index('idx_electricity_cost_site_code', table_name='electricity_costs')
    op.drop_index('idx_electricity_cost_finalized', table_name='electricity_costs')
    op.drop_index('idx_electricity_cost_period', table_name='electricity_costs')
    op.drop_index('idx_electricity_cost_dc_month', table_name='electricity_costs')
    op.drop_index('idx_electricity_rate_site_code', table_name='electricity_rates')
    op.drop_index('idx_electricity_rate_effective', table_name='electricity_rates')
    op.drop_index('idx_electricity_rate_dc_active', table_name='electricity_rates')
    
    # Drop tables
    op.drop_table('electricity_costs')
    op.drop_table('electricity_rates')
