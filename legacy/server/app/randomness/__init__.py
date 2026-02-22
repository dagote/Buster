"""
Drand Client Module

Reads randomness from the Drand beacon.
Drand is a network of independent operators producing verifiable randomness.

Website: https://drand.love
Beacon: https://drandbeacon.io
"""

import httpx
from typing import Optional
import time


class DrandClient:
    """Client for reading Drand randomness beacon"""

    # Mainchain (production) - new random every ~61 seconds
    MAINCHAIN_URL = "https://drand.cloudflare.com"
    # Testnet (for testing) - faster rounds
    TESTNET_URL = "https://pl-eu.testnet.drand.sh"

    def __init__(self, use_mainchain: bool = True, timeout: int = 10):
        """
        Initialize Drand client.

        Args:
            use_mainchain: Use mainchain (slower, more secure) vs testnet
            timeout: HTTP timeout in seconds
        """
        self.base_url = self.MAINCHAIN_URL if use_mainchain else self.TESTNET_URL
        self.timeout = timeout
        self.client = httpx.AsyncClient(timeout=timeout)

    async def get_latest(self) -> dict:
        """
        Get the latest Drand randomness.

        Returns:
            {
                "round": 123456,
                "randomness": "0xabc123...",
                "signature": "...",
                "timestamp": 1698765432
            }
        """
        try:
            response = await self.client.get(f"{self.base_url}/latest")
            response.raise_for_status()
            data = response.json()

            return {
                "round": int(data["round"]),
                "randomness": data["randomness"],
                "signature": data["signature"],
                "timestamp": int(data["timestamp"]),
            }
        except Exception as e:
            raise RuntimeError(f"Failed to fetch latest Drand: {e}")

    async def get_by_round(self, round_number: int) -> dict:
        """
        Get Drand randomness for a specific round.

        Args:
            round_number: The Drand round to fetch

        Returns:
            Same structure as get_latest()
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/public/{round_number}"
            )
            response.raise_for_status()
            data = response.json()

            return {
                "round": int(data["round"]),
                "randomness": data["randomness"],
                "signature": data.get("signature", ""),
                "timestamp": int(data["timestamp"]),
            }
        except Exception as e:
            raise RuntimeError(f"Failed to fetch Drand round {round_number}: {e}")

    async def randomness_to_int(self, randomness_hex: str) -> int:
        """
        Convert hex randomness string to integer.

        Args:
            randomness_hex: Hex string (with or without 0x prefix)

        Returns:
            Integer value of randomness
        """
        if randomness_hex.startswith("0x"):
            randomness_hex = randomness_hex[2:]
        return int(randomness_hex, 16)

    async def wait_for_round(self, target_round: int, check_interval: int = 5):
        """
        Wait for a specific Drand round to be available.

        Args:
            target_round: The round number to wait for
            check_interval: How often to check (seconds)

        Returns:
            Drand data when round becomes available
        """
        max_wait = 600  # 10 minutes
        elapsed = 0

        while elapsed < max_wait:
            try:
                data = await self.get_by_round(target_round)
                return data
            except:
                await httpx.AsyncClient().aclose()
                await httpx.sleep(check_interval)
                elapsed += check_interval

        raise TimeoutError(f"Drand round {target_round} did not become available")

    async def get_recent_rounds(self, count: int = 10) -> list:
        """Get the N most recent rounds"""
        latest = await self.get_latest()
        rounds = []

        for i in range(count):
            round_num = latest["round"] - i
            try:
                data = await self.get_by_round(round_num)
                rounds.append(data)
            except:
                pass

        return rounds

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Synchronous wrapper for compatibility
class DrandClientSync:
    """Synchronous wrapper around async DrandClient"""

    def __init__(self, use_mainchain: bool = True):
        self.use_mainchain = use_mainchain

    def get_latest(self) -> dict:
        """Get latest Drand randomness (sync)"""
        import asyncio

        async def _fetch():
            client = DrandClient(self.use_mainchain)
            data = await client.get_latest()
            await client.close()
            return data

        return asyncio.run(_fetch())

    def get_by_round(self, round_number: int) -> dict:
        """Get Drand randomness for specific round (sync)"""
        import asyncio

        async def _fetch():
            client = DrandClient(self.use_mainchain)
            data = await client.get_by_round(round_number)
            await client.close()
            return data

        return asyncio.run(_fetch())

    def randomness_to_int(self, randomness_hex: str) -> int:
        """Convert randomness to integer (sync)"""
        if randomness_hex.startswith("0x"):
            randomness_hex = randomness_hex[2:]
        return int(randomness_hex, 16)
