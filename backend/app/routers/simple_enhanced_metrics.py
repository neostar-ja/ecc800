"""
Simple Enhanced Metrics API for Testing
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import logging

from app.core.database import execute_raw_query
from app.services.auth import get_current_user
from app.schemas.auth import User

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/enhanced-metrics-simple")
async def get_simple_enhanced_metrics(
    site_code: Optional[str] = Query(None, description="รหัสไซต์"),
    equipment_id: Optional[str] = Query(None, description="รหัสอุปกรณ์"),
    current_user: User = Depends(get_current_user),
):
    """
    Simple version of enhanced metrics
    """
    try:
        conditions = ["performance_data IS NOT NULL"]
        params = {}
        
        if site_code:
            conditions.append("site_code = :site_code")
            params["site_code"] = site_code
            
        if equipment_id:
            conditions.append("equipment_id = :equipment_id")
            params["equipment_id"] = equipment_id
        
        where_clause = " AND ".join(conditions)
        
        query = f"""
        SELECT DISTINCT
            performance_data as metric_name,
            COALESCE(unit, 'N/A') as unit,
            COUNT(*) as data_points,
            MIN(statistical_start_time) as first_seen,
            MAX(statistical_start_time) as last_seen
        FROM performance_data
        WHERE {where_clause}
        GROUP BY performance_data, unit
        ORDER BY data_points DESC, metric_name
        LIMIT 50;
        """
        
        results = await execute_raw_query(query, params)
        
        # Simple categorization
        categories = {
            "environmental": {
                "name": "environmental",
                "display_name": "สิ่งแวดล้อม",
                "icon": "🌡️",
                "color": "#4caf50",
                "metrics": []
            },
            "electrical": {
                "name": "electrical", 
                "display_name": "ไฟฟ้า",
                "icon": "⚡",
                "color": "#ff9800",
                "metrics": []
            },
            "other": {
                "name": "other",
                "display_name": "อื่นๆ",
                "icon": "📊",
                "color": "#9e9e9e", 
                "metrics": []
            }
        }
        
        for row in results:
            metric_name = row["metric_name"].lower()
            
            if 'temperature' in metric_name or 'humidity' in metric_name:
                category = "environmental"
            elif 'current' in metric_name or 'power' in metric_name or 'voltage' in metric_name:
                category = "electrical"
            else:
                category = "other"
            
            categories[category]["metrics"].append({
                "metric_name": row["metric_name"],
                "display_name": row["metric_name"],
                "unit": row["unit"],
                "data_points": row["data_points"],
                "first_seen": row["first_seen"].isoformat() if row["first_seen"] else None,
                "last_seen": row["last_seen"].isoformat() if row["last_seen"] else None,
                "category": category,
                "icon": categories[category]["icon"],
                "color": categories[category]["color"]
            })
        
        return [cat for cat in categories.values() if cat["metrics"]]
        
    except Exception as e:
        logger.error(f"Error getting simple enhanced metrics: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"ไม่สามารถดึงข้อมูล metrics: {str(e)}"
        )
