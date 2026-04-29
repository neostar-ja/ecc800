#!/usr/bin/env python3
"""
Calculate electricity costs from performance power data
สคริปต์สำหรับคำนวณค่าไฟฟ้าจากข้อมูลการใช้พลังงาน
"""

import asyncio
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import get_settings
from app.models.models import ElectricityRate, ElectricityCost, DataCenter

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
settings = get_settings()

async def get_async_session():
    """Get async database session"""
    engine = create_async_engine(
        settings.database_url,
        echo=False,
        future=True,
    )
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return async_session


async def get_power_consumption(
    session: AsyncSession,
    data_center_id: int,
    start_date: datetime,
    end_date: datetime
) -> Decimal:
    """
    Get total power consumption (kWh) from performance data
    ดึงพลังงานรวม (kWh) จากตารางค่าประสิทธิภาพ
    """
    try:
        # Query from performance_data table
        # Note: Assuming performance_data has a structure with:
        # - equipment_id (UPS Cabinet)
        # - input_total_active_power (kW)
        # - statistical_start_time (timestamp)
        
        # This is a simplified query - adjust based on actual schema
        query = """
        SELECT 
            SUM(COALESCE(CAST(data->>'input_total_active_power' AS FLOAT), 0)) * 
            (EXTRACT(EPOCH FROM %s - %s) / 3600) / 1000 as total_kwh
        FROM performance_data
        WHERE 
            equipment_name LIKE '%UPS%Cabinet%'
            AND statistical_start_time >= %s
            AND statistical_start_time <= %s
        """
        
        result = await session.execute(
            query,
            (end_date, start_date, start_date, end_date)
        )
        
        row = result.fetchone()
        if row and row[0]:
            return Decimal(str(row[0]))
        return Decimal(0)
    
    except Exception as e:
        logger.error(f"Error calculating power consumption: {e}")
        return Decimal(0)


async def calculate_monthly_costs(
    session: AsyncSession,
    data_center_id: int,
    year: int,
    month: int
) -> bool:
    """
    Calculate electricity cost for a specific month
    คำนวณค่าไฟฟ้าสำหรับเดือนที่กำหนด
    """
    try:
        # Calculate month start and end dates
        month_start = datetime(year, month, 1)
        if month == 12:
            month_end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(year, month + 1, 1) - timedelta(days=1)
        
        # Get data center
        dc_result = await session.execute(
            select(DataCenter).where(DataCenter.id == data_center_id)
        )
        data_center = dc_result.scalar()
        if not data_center:
            logger.error(f"Data center {data_center_id} not found")
            return False
        
        # Get active electricity rate for this period
        rate_result = await session.execute(
            select(ElectricityRate)
            .where(
                and_(
                    ElectricityRate.data_center_id == data_center_id,
                    ElectricityRate.is_active == True,
                    ElectricityRate.effective_from <= month_end,
                    (ElectricityRate.effective_to.is_(None) | (ElectricityRate.effective_to >= month_start))
                )
            )
            .order_by(ElectricityRate.effective_from.desc())
        )
        rate = rate_result.scalar()
        
        if not rate:
            logger.warning(f"No active electricity rate for {data_center.name} on {year}-{month:02d}")
            return False
        
        # Get power consumption data (simplified - in production, query actual power data)
        # For now, using placeholder calculation
        days_in_month = (month_end - month_start).days + 1
        
        # Calculate energy (placeholder - should be fetched from performance_data)
        # Assuming average 100 kW for UPS cabinet usage
        total_energy_kwh = Decimal(100) * Decimal(24) * Decimal(days_in_month)  # 100 kW * 24 hours * days
        
        # Calculate cost
        total_cost_baht = total_energy_kwh * rate.rate_value
        avg_daily_energy_kwh = total_energy_kwh / Decimal(days_in_month)
        
        # Check if cost record already exists
        existing_result = await session.execute(
            select(ElectricityCost)
            .where(
                and_(
                    ElectricityCost.data_center_id == data_center_id,
                    ElectricityCost.year == year,
                    ElectricityCost.month == month
                )
            )
        )
        existing_cost = existing_result.scalar()
        
        if existing_cost:
            # Update existing record
            existing_cost.total_energy_kwh = total_energy_kwh
            existing_cost.average_rate = rate.rate_value
            existing_cost.total_cost_baht = total_cost_baht
            existing_cost.days_in_period = days_in_month
            existing_cost.avg_daily_energy_kwh = avg_daily_energy_kwh
            existing_cost.updated_by = 'system'
            logger.info(f"Updated cost for {data_center.name} {year}-{month:02d}")
        else:
            # Create new record
            new_cost = ElectricityCost(
                data_center_id=data_center_id,
                site_code=data_center.site_code,
                year=year,
                month=month,
                month_start=month_start,
                month_end=month_end,
                total_energy_kwh=total_energy_kwh,
                average_rate=rate.rate_value,
                total_cost_baht=total_cost_baht,
                days_in_period=days_in_month,
                avg_daily_energy_kwh=avg_daily_energy_kwh,
                peak_hour_energy_kwh=Decimal(100),  # Placeholder
                calculation_method='automatic',
                created_by='system'
            )
            session.add(new_cost)
            logger.info(f"Created cost record for {data_center.name} {year}-{month:02d}")
        
        await session.commit()
        return True
    
    except Exception as e:
        logger.error(f"Error calculating monthly costs: {e}")
        await session.rollback()
        return False


async def calculate_all_recent_months(days_back: int = 90):
    """
    Calculate electricity costs for all data centers for recent months
    คำนวณค่าไฟฟ้าสำหรับแต่ละ Data Center สำหรับเดือนที่ผ่านมา
    """
    try:
        async_session_factory = await get_async_session()
        
        async with async_session_factory() as session:
            # Get all data centers
            dc_result = await session.execute(select(DataCenter).where(DataCenter.is_active == True))
            data_centers = dc_result.scalars().all()
            
            if not data_centers:
                logger.error("No active data centers found")
                return False
            
            logger.info(f"Found {len(data_centers)} active data centers")
            
            # Calculate for recent months
            today = datetime.now()
            start_date = today - timedelta(days=days_back)
            
            success_count = 0
            error_count = 0
            
            for month_offset in range(days_back // 30 + 1):
                current_date = start_date + timedelta(days=month_offset * 30)
                year = current_date.year
                month = current_date.month
                
                for dc in data_centers:
                    result = await calculate_monthly_costs(session, dc.id, year, month)
                    if result:
                        success_count += 1
                    else:
                        error_count += 1
            
            logger.info(f"Calculation complete. Success: {success_count}, Errors: {error_count}")
            return success_count > error_count
    
    except Exception as e:
        logger.error(f"Error in calculation: {e}")
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Calculate electricity costs')
    parser.add_argument('--days-back', type=int, default=90, help='Days back to calculate (default: 90)')
    parser.add_argument('--datacenter-id', type=int, help='Specific data center ID')
    parser.add_argument('--year', type=int, help='Specific year')
    parser.add_argument('--month', type=int, help='Specific month')
    
    args = parser.parse_args()
    
    # Run calculation
    if args.datacenter_id and args.year and args.month:
        logger.info(f"Calculating cost for DC {args.datacenter_id}, {args.year}-{args.month:02d}")
        # asyncio.run(calculate_monthly_costs(...))
    else:
        logger.info("Calculating costs for recent months")
        asyncio.run(calculate_all_recent_months(args.days_back))
