from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import json
import os
import ipaddress

router = APIRouter()

STATUS_FILE = "/app/pipeline_status.json"

class PipelineStatus(BaseModel):
    pipeline_id: str
    status: str
    phase: Optional[str] = None
    message: Optional[str] = None
    updated_at: Optional[str] = None


def _is_trusted_client(host: Optional[str]) -> bool:
    if not host:
        return False

    # Accept localhost and private network addresses used by docker/nginx internal routing.
    if host in {"localhost", "127.0.0.1", "::1"}:
        return True

    try:
        ip = ipaddress.ip_address(host)
        return ip.is_private or ip.is_loopback
    except ValueError:
        return False

@router.get("/status")
async def get_all_pipeline_status():
    all_statuses = {}
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                all_statuses = json.load(f)
        except Exception:
            pass
    
    active_pipelines = []
    now = datetime.now()
    
    for pid, data in all_statuses.items():
        # Check for timeout (2 hours)
        is_stale = False
        if "updated_at" in data and data["updated_at"]:
            try:
                updated = datetime.fromisoformat(data["updated_at"])
                if (now - updated).total_seconds() > 7200:
                    is_stale = True
            except Exception:
                is_stale = True
        
        if not is_stale and data.get("status") != "idle":
            active_pipelines.append(data)
            
    return {"pipelines": active_pipelines}

@router.post("/status")
async def update_pipeline_status(status: PipelineStatus, request: Request):
    client_host = request.client.host if request.client else None
    if not _is_trusted_client(client_host):
        raise HTTPException(status_code=403, detail="pipeline status update is restricted to trusted network")

    # Basic payload bounds to prevent accidental or malicious oversized writes.
    if len(status.pipeline_id) > 120:
        raise HTTPException(status_code=400, detail="pipeline_id too long")
    if status.message and len(status.message) > 1000:
        raise HTTPException(status_code=400, detail="message too long")

    all_statuses = {}
    if os.path.exists(STATUS_FILE):
        try:
            with open(STATUS_FILE, "r") as f:
                all_statuses = json.load(f)
        except Exception:
            pass
    
    pid = status.pipeline_id
    data = status.dict()
    data["updated_at"] = datetime.now().isoformat()
    
    all_statuses[pid] = data
    
    try:
        with open(STATUS_FILE, "w") as f:
            json.dump(all_statuses, f)
        return {"success": True, "pipeline_id": pid, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
