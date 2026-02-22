"""
Utility functions for Buster Server
"""

from web3 import Web3
from eth_account.messages import encode_defunct
from eth_account import Account
from typing import Tuple


def validate_eth_address(address: str) -> bool:
    """Validate Ethereum address format"""
    try:
        Web3.to_checksum_address(address)
        return True
    except:
        return False


def normalize_address(address: str) -> str:
    """Normalize address to checksummed format"""
    return Web3.to_checksum_address(address)


def verify_signature(
    message: str, signature: str, expected_address: str
) -> bool:
    """
    Verify that a message was signed by the expected address.

    Args:
        message: Original message
        signature: Signature hex string
        expected_address: Address that should have signed

    Returns:
        True if signature is valid and from expected address
    """
    try:
        message_hash = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_hash, signature=signature)
        return (
            Web3.to_checksum_address(recovered_address)
            == Web3.to_checksum_address(expected_address)
        )
    except:
        return False


def from_wei(amount_wei: int, decimals: int = 18) -> float:
    """Convert wei to decimal amount"""
    return amount_wei / (10 ** decimals)


def to_wei(amount: float, decimals: int = 18) -> int:
    """Convert decimal amount to wei"""
    return int(amount * (10 ** decimals))
