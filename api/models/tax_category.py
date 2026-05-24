from sqlalchemy import Column, String
import uuid
from db.session import Base

class TaxCategory(Base):
    __tablename__ = "tax_categories"
    
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True)
    irs_code = Column(String, nullable=True)
