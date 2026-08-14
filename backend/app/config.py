from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Brand
    brand_name: str = "NovaBot"
    brand_name_fa: str = "نوابات"

    # API (Google AI Studio / Gemini)
    api_base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    api_key: str = ""
    llm_model: str = "gemini-1.5-flash"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    embedding_provider: str = "local"

    # Data source: "mock" or "productplus"
    data_source: str = "mock"
    productplus_access_mode: str = "db"

    # ProductPlus DB (used when data_source == "productplus" and productplus_access_mode == "db")
    productplus_host: str = "localhost"
    productplus_port: int = 5432
    productplus_db: str = "SyntaSys"
    productplus_user: str = "admin"
    productplus_password: str = "1234"

    # ProductPlus API (used when data_source == "productplus" and productplus_access_mode == "api")
    productplus_api_url: str = "http://localhost:8000/api/v1/store/products/"
    productplus_api_key: str = ""
    productplus_api_timeout: float = 15.0

    # AI Document Validation
    ai_validation_enabled: bool = True
    ai_validation_model: str = "gemini-1.5-flash"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
