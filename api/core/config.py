from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Accounting at your Service"
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    MOCK_MODE: bool = True # Default to True for safety/demos
    PLAID_CLIENT_ID: Optional[str] = None
    PLAID_SECRET: Optional[str] = None
    PLAID_ENV: str = "sandbox"
    SECRET_KEY: str = "demo-secret-key-123" # Provide a default for demos
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_REGION: str = "us-east-1"
    S3_BUCKET_NAME: str = "accounting-service-receipts"
    GEMINI_API_KEY: Optional[str] = None
    
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # Stripe Price IDs
    STRIPE_PRICE_PROFESSIONAL: str = "price_1Tajc5RxO2b0JlPWWoPPUv25"
    STRIPE_PRICE_BUSINESS: str = "price_mock_bus"

    class Config:
        env_file = ".env"

settings = Settings()
