"""
Base models for ECC800 system
"""
# Import Base and all models from models module
from app.models.models import Base
from app.models.models import (
    User, DataCenter, Equipment, EquipmentAlias, DashboardObject, DashboardTemplate
)
