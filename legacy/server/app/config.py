"""
Configuration management for Buster Server
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Server configuration from environment variables"""

    # Network
    polygon_rpc_url: str
    environment: str = "development"
    debug: bool = True
    port: int = 8000
    host: str = "0.0.0.0"

    # Smart Contract
    contract_address: str
    contract_abi_path: str

    # Server Wallet (authorized to settle bets)
    server_private_key: str
    server_wallet_address: str

    # Game Configuration
    min_bet: float = 0.01
    max_bet: float = 1000.0
    game_timeout_seconds: int = 300

    # Matchmaking
    matchmaking_timeout_seconds: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = False
        env_file_encoding = "utf-8"


# Global settings instance
settings = Settings()
