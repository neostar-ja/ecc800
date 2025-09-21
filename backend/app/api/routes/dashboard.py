"""
Dashboard Objects API Router
API สำหรับจัดการวัตถุใน Dashboard 2D Canvas
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
import json
from datetime import datetime

from app.db.database import get_db
from app.models.models import DashboardObject, DashboardTemplate, DataCenter
from app.schemas.dashboard import (
    DashboardObjectCreate, 
    DashboardObjectUpdate, 
    DashboardObjectResponse,
    DashboardObjectsBulkCreate,
    DashboardObjectsBulkUpdate,
    DashboardObjectsBulkResponse,
    DashboardTemplateCreate,
    DashboardTemplateUpdate,
    DashboardTemplateResponse,
    CanvasExportResponse,
    CanvasImportRequest
)
from app.auth.dependencies import get_current_user
from app.models.models import User

router = APIRouter(prefix="/dashboard", tags=["Dashboard Objects"])


# Dashboard Objects CRUD
@router.get("/objects", response_model=List[DashboardObjectResponse])
async def get_dashboard_objects(
    data_center_id: Optional[int] = Query(None, description="Filter by data center ID"),
    object_type: Optional[str] = Query(None, description="Filter by object type"),
    is_visible: Optional[bool] = Query(None, description="Filter by visibility"),
    equipment_id: Optional[str] = Query(None, description="Filter by equipment ID"),
    skip: int = Query(0, ge=0, description="Skip records"),
    limit: int = Query(100, ge=1, le=1000, description="Limit records"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึงรายการ Dashboard Objects"""
    query = db.query(DashboardObject)
    
    # Apply filters
    if data_center_id is not None:
        query = query.filter(DashboardObject.data_center_id == data_center_id)
    if object_type:
        query = query.filter(DashboardObject.object_type == object_type)
    if is_visible is not None:
        query = query.filter(DashboardObject.is_visible == is_visible)
    if equipment_id:
        query = query.filter(DashboardObject.equipment_id == equipment_id)
    
    # Order by layer_order and creation time
    query = query.order_by(DashboardObject.layer_order.asc(), DashboardObject.created_at.asc())
    
    # Pagination
    objects = query.offset(skip).limit(limit).all()
    
    return objects


@router.get("/objects/{object_id}", response_model=DashboardObjectResponse)
async def get_dashboard_object(
    object_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึง Dashboard Object ตาม ID"""
    obj = db.query(DashboardObject).filter(DashboardObject.id == object_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Dashboard object not found")
    return obj


@router.post("/objects", response_model=DashboardObjectResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard_object(
    obj_data: DashboardObjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """สร้าง Dashboard Object ใหม่"""
    
    # Verify data center exists
    data_center = db.query(DataCenter).filter(DataCenter.id == obj_data.data_center_id).first()
    if not data_center:
        raise HTTPException(status_code=404, detail="Data center not found")
    
    # Convert properties to JSON string if provided
    properties_json = json.dumps(obj_data.properties) if obj_data.properties else None
    
    # Create new object
    db_obj = DashboardObject(
        **obj_data.dict(exclude={'properties'}),
        properties=properties_json,
        created_by=current_user.username,
        updated_by=current_user.username
    )
    
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    
    return db_obj


@router.put("/objects/{object_id}", response_model=DashboardObjectResponse)
async def update_dashboard_object(
    object_id: int,
    obj_update: DashboardObjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """อัปเดท Dashboard Object"""
    
    # Get existing object
    db_obj = db.query(DashboardObject).filter(DashboardObject.id == object_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Dashboard object not found")
    
    # Update fields
    update_data = obj_update.dict(exclude_unset=True, exclude={'properties'})
    
    # Handle properties separately
    if obj_update.properties is not None:
        update_data['properties'] = json.dumps(obj_update.properties)
    
    # Add updated_by
    update_data['updated_by'] = current_user.username
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
    
    db.commit()
    db.refresh(db_obj)
    
    return db_obj


@router.delete("/objects/{object_id}")
async def delete_dashboard_object(
    object_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ลบ Dashboard Object"""
    
    db_obj = db.query(DashboardObject).filter(DashboardObject.id == object_id).first()
    if not db_obj:
        raise HTTPException(status_code=404, detail="Dashboard object not found")
    
    db.delete(db_obj)
    db.commit()
    
    return {"message": "Dashboard object deleted successfully"}


# Bulk Operations
@router.post("/objects/bulk", response_model=DashboardObjectsBulkResponse)
async def create_dashboard_objects_bulk(
    bulk_data: DashboardObjectsBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """สร้าง Dashboard Objects หลายรายการพร้อมกัน"""
    
    created_objects = []
    errors = []
    
    for obj_data in bulk_data.objects:
        try:
            # Verify data center exists
            data_center = db.query(DataCenter).filter(DataCenter.id == obj_data.data_center_id).first()
            if not data_center:
                errors.append(f"Data center {obj_data.data_center_id} not found for object {obj_data.name}")
                continue
            
            # Convert properties to JSON string if provided
            properties_json = json.dumps(obj_data.properties) if obj_data.properties else None
            
            # Create new object
            db_obj = DashboardObject(
                **obj_data.dict(exclude={'properties'}),
                properties=properties_json,
                created_by=current_user.username,
                updated_by=current_user.username
            )
            
            db.add(db_obj)
            db.flush()  # Flush to get ID
            created_objects.append(db_obj)
            
        except Exception as e:
            errors.append(f"Error creating object {obj_data.name}: {str(e)}")
    
    db.commit()
    
    # Refresh all created objects
    for obj in created_objects:
        db.refresh(obj)
    
    return DashboardObjectsBulkResponse(
        success_count=len(created_objects),
        failed_count=len(errors),
        objects=created_objects,
        errors=errors
    )


@router.put("/objects/bulk", response_model=DashboardObjectsBulkResponse)
async def update_dashboard_objects_bulk(
    bulk_update: DashboardObjectsBulkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """อัปเดท Dashboard Objects หลายรายการพร้อมกัน"""
    
    updated_objects = []
    errors = []
    
    for update_item in bulk_update.updates:
        try:
            object_id = update_item.get('id')
            if not object_id:
                errors.append("Missing 'id' field in update item")
                continue
            
            # Get existing object
            db_obj = db.query(DashboardObject).filter(DashboardObject.id == object_id).first()
            if not db_obj:
                errors.append(f"Dashboard object with ID {object_id} not found")
                continue
            
            # Update fields
            update_data = {k: v for k, v in update_item.items() if k != 'id'}
            
            # Handle properties separately
            if 'properties' in update_data and update_data['properties'] is not None:
                update_data['properties'] = json.dumps(update_data['properties'])
            
            # Add updated_by
            update_data['updated_by'] = current_user.username
            
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            
            updated_objects.append(db_obj)
            
        except Exception as e:
            errors.append(f"Error updating object ID {update_item.get('id', 'unknown')}: {str(e)}")
    
    db.commit()
    
    # Refresh all updated objects
    for obj in updated_objects:
        db.refresh(obj)
    
    return DashboardObjectsBulkResponse(
        success_count=len(updated_objects),
        failed_count=len(errors),
        objects=updated_objects,
        errors=errors
    )


# Canvas Export/Import
@router.get("/canvas/export/{data_center_id}", response_model=CanvasExportResponse)
async def export_canvas(
    data_center_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Export canvas data"""
    
    # Verify data center exists
    data_center = db.query(DataCenter).filter(DataCenter.id == data_center_id).first()
    if not data_center:
        raise HTTPException(status_code=404, detail="Data center not found")
    
    # Get all objects for this data center
    objects = db.query(DashboardObject).filter(
        DashboardObject.data_center_id == data_center_id
    ).order_by(DashboardObject.layer_order.asc()).all()
    
    return CanvasExportResponse(
        data_center_id=data_center_id,
        objects=objects,
        canvas_settings={
            "width": 1920,
            "height": 1080,
            "background": "#F5F5F5"
        },
        export_timestamp=datetime.now()
    )


@router.post("/canvas/import")
async def import_canvas(
    import_data: CanvasImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import canvas data"""
    
    # Verify data center exists
    data_center = db.query(DataCenter).filter(DataCenter.id == import_data.data_center_id).first()
    if not data_center:
        raise HTTPException(status_code=404, detail="Data center not found")
    
    # Clear existing objects if requested
    if import_data.clear_existing:
        db.query(DashboardObject).filter(
            DashboardObject.data_center_id == import_data.data_center_id
        ).delete()
    
    created_objects = []
    errors = []
    
    for obj_data in import_data.objects:
        try:
            # Convert properties to JSON string if provided
            properties_json = json.dumps(obj_data.properties) if obj_data.properties else None
            
            # Create new object
            db_obj = DashboardObject(
                **obj_data.dict(exclude={'properties'}),
                properties=properties_json,
                created_by=current_user.username,
                updated_by=current_user.username
            )
            
            db.add(db_obj)
            db.flush()
            created_objects.append(db_obj)
            
        except Exception as e:
            errors.append(f"Error importing object {obj_data.name}: {str(e)}")
    
    db.commit()
    
    return {
        "message": "Canvas import completed",
        "imported_count": len(created_objects),
        "error_count": len(errors),
        "errors": errors
    }


# Dashboard Templates CRUD
@router.get("/templates", response_model=List[DashboardTemplateResponse])
async def get_dashboard_templates(
    data_center_id: Optional[int] = Query(None, description="Filter by data center ID"),
    is_public: Optional[bool] = Query(None, description="Filter by public/private"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึงรายการ Dashboard Templates"""
    query = db.query(DashboardTemplate)
    
    if data_center_id is not None:
        query = query.filter(DashboardTemplate.data_center_id == data_center_id)
    if is_public is not None:
        query = query.filter(DashboardTemplate.is_public == is_public)
    
    query = query.order_by(DashboardTemplate.created_at.desc())
    templates = query.offset(skip).limit(limit).all()
    
    return templates


@router.post("/templates", response_model=DashboardTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_dashboard_template(
    template_data: DashboardTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """สร้าง Dashboard Template ใหม่"""
    
    # Convert template_data to JSON string
    template_json = json.dumps(template_data.template_data)
    
    # Create new template
    db_template = DashboardTemplate(
        **template_data.dict(exclude={'template_data'}),
        template_data=template_json,
        created_by=current_user.username,
        updated_by=current_user.username
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return db_template


@router.get("/templates/{template_id}", response_model=DashboardTemplateResponse)
async def get_dashboard_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ดึง Dashboard Template ตาม ID"""
    template = db.query(DashboardTemplate).filter(DashboardTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Dashboard template not found")
    return template


@router.put("/templates/{template_id}", response_model=DashboardTemplateResponse)
async def update_dashboard_template(
    template_id: int,
    template_update: DashboardTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """อัปเดท Dashboard Template"""
    
    db_template = db.query(DashboardTemplate).filter(DashboardTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Dashboard template not found")
    
    # Update fields
    update_data = template_update.dict(exclude_unset=True, exclude={'template_data'})
    
    # Handle template_data separately
    if template_update.template_data is not None:
        update_data['template_data'] = json.dumps(template_update.template_data)
    
    # Add updated_by
    update_data['updated_by'] = current_user.username
    
    for field, value in update_data.items():
        setattr(db_template, field, value)
    
    db.commit()
    db.refresh(db_template)
    
    return db_template


@router.delete("/templates/{template_id}")
async def delete_dashboard_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ลบ Dashboard Template"""
    
    db_template = db.query(DashboardTemplate).filter(DashboardTemplate.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Dashboard template not found")
    
    db.delete(db_template)
    db.commit()
    
    return {"message": "Dashboard template deleted successfully"}