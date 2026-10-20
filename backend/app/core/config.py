import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ROOT_DB = _PROJECT_ROOT / "lendlens.db"
_RAW_DB_URL = os.getenv("DATABASE_URL", "")
if not _RAW_DB_URL or _RAW_DB_URL in ["sqlite:///./lendlens.db", "sqlite:///lendlens.db"]:
    _DEFAULT_DB = f"sqlite:///{_ROOT_DB}"
else:
    _DEFAULT_DB = _RAW_DB_URL

class Settings(BaseSettings):
    PROJECT_NAME: str = "LendLens API"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = _DEFAULT_DB
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]
    
    # AI / LLM Configuration (Optional with deterministic fallback)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore"
    )

settings = Settings()
