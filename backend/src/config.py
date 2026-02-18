from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_env_file = Path(__file__).resolve().parent.parent / ".env"
if not _env_file.exists():
    _env_file = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_env_file, extra="ignore")

    database_url: str = "postgresql://app:secret@localhost:21002/app"
    upload_dir: Path = Path(__file__).resolve().parent.parent / "uploads"
    cors_origins: str = "http://localhost:21000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",")]


settings = Settings()
