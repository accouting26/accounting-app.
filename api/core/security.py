from cryptography.fernet import Fernet
from core.config import settings

def encrypt_token(token: str) -> str:
    f = Fernet(settings.SECRET_KEY.encode())
    return f.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    f = Fernet(settings.SECRET_KEY.encode())
    return f.decrypt(encrypted_token.encode()).decode()
