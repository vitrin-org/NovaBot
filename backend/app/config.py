from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Brand
    brand_name: str = "NovaBot"
    brand_name_fa: str = "نوابات"

    # API
    api_base_url: str = "https://hooshyar.payampardaz.com/api/v1"
    api_key: str = "sk-4fde6674ba894ac495fac12b8125aee0"
    llm_model: str = "gemini-3.1-flash-lite-preview"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    embedding_provider: str = "local"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
