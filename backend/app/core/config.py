from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase
    SUPABASE_URL: str
    SUPABASE_SECRET_KEY: str
    SUPABASE_PUBLISHABLE_KEY: str
    SUPABASE_JWKS_URL: str

    # App
    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # JWT
    JWT_ALGORITHM: str = "RS256"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
