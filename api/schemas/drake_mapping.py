from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DrakeMappingBase(BaseModel):
    category_id: str
    drake_account_code: str

class DrakeMappingCreate(DrakeMappingBase):
    pass

class DrakeMapping(DrakeMappingBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
