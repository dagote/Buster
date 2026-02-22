"""
Blockchain interaction module for Buster Server

Handles all Web3.py interactions with the BitcinoBetEscrow contract.
"""

import json
from pathlib import Path
from web3 import Web3
from eth_account import Account
from app.config import settings


class BlockchainClient:
    """Web3 client for contract interaction"""

    def __init__(self):
        """Initialize Web3 connection and contract"""
        # Connect to Polygon
        self.w3 = Web3(Web3.HTTPProvider(settings.polygon_rpc_url))

        if not self.w3.is_connected():
            raise RuntimeError("Failed to connect to Polygon RPC")

        # Load contract ABI
        abi_path = Path(settings.contract_abi_path)
        if not abi_path.exists():
            raise FileNotFoundError(f"Contract ABI not found at {abi_path}")

        with open(abi_path, "r") as f:
            contract_artifact = json.load(f)

        # Extract ABI from artifact (Hardhat format includes _format, bytecode, etc.)
        if isinstance(contract_artifact, dict) and "abi" in contract_artifact:
            contract_abi = contract_artifact["abi"]
        else:
            contract_abi = contract_artifact

        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(settings.contract_address),
            abi=contract_abi,
        )

        # Load server wallet
        self.server_account = Account.from_key(settings.server_private_key)
        self.server_address = Web3.to_checksum_address(self.server_account.address)

    def settle_wager(self, bet_id: int, winner_address: str) -> dict:
        """
        Call contract to settle a wager (DEPRECATED).
        Use settle_wager_with_drand() instead for verifiable randomness.

        Args:
            bet_id: ID of the bet to settle
            winner_address: Address of the winning player

        Returns:
            Transaction receipt
        """
        winner_address = Web3.to_checksum_address(winner_address)

        # Build transaction
        tx_data = self.contract.functions.settleWager(
            bet_id, winner_address
        ).build_transaction(
            {
                "from": self.server_address,
                "nonce": self.w3.eth.get_transaction_count(self.server_address),
                "gas": 300000,
                "gasPrice": self.w3.eth.gas_price,
            }
        )

        # Sign transaction
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_data, self.server_account.key
        )

        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "tx_hash": receipt["transactionHash"].hex(),
            "status": "success" if receipt["status"] == 1 else "failed",
            "gas_used": receipt["gasUsed"],
        }

    def settle_wager_with_drand(
        self, bet_id: int, drand_round: int, drand_value: int, winner_address: str = None
    ) -> dict:
        """
        Call contract to settle a wager using Drand randomness (PRIMARY METHOD).
        
        The outcome is deterministic and verifiable via drandbeacon.io.
        Contract derives same rolls as our server calculation, guaranteeing consistency.
        Winner is computed on-chain from Drand value (winner_address param is ignored).

        Args:
            bet_id: ID of the bet to settle
            drand_round: Drand round number (identifies randomness)
            drand_value: Drand randomness value (uint256)
            winner_address: (unused - winner derived from Drand on-chain)

        Returns:
            Transaction receipt with Drand parameters logged
        """
        # Build transaction for settleWagerWithDrand
        # Winner is derived on-chain from drand_value, we don't need to pass it
        tx_data = self.contract.functions.settleWagerWithDrand(
            bet_id, drand_round, drand_value
        ).build_transaction(
            {
                "from": self.server_address,
                "nonce": self.w3.eth.get_transaction_count(self.server_address),
                "gas": 500000,  # Slightly higher gas for Drand settlement
                "gasPrice": self.w3.eth.gas_price,
            }
        )

        # Sign transaction
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_data, self.server_account.key
        )

        # Send transaction
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Wait for receipt
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)

        return {
            "tx_hash": receipt["transactionHash"].hex(),
            "status": "success" if receipt["status"] == 1 else "failed",
            "gas_used": receipt["gasUsed"],
            "drand_round": drand_round,
            "drand_value": drand_value,
        }

    def get_bet(self, bet_id: int) -> dict:
        """Get bet details from contract"""
        bet_tuple = self.contract.functions.getBet(bet_id).call()

        # Unpack tuple into dict
        return {
            "betId": bet_tuple[0],
            "player1": bet_tuple[1],
            "player2": bet_tuple[2],
            "amount": bet_tuple[3],
            "status": bet_tuple[4],  # 0=Pending, 1=Active, 2=Settled, 3=Canceled
            "winner": bet_tuple[5],
            "settledAt": bet_tuple[6],
            "gameType": bet_tuple[7],
        }

    def get_balance(self, address: str) -> int:
        """Get claimable balance for an address"""
        address = Web3.to_checksum_address(address)
        return self.contract.functions.getBalance(address).call()

    def get_wallet_balance(self, address: str) -> int:
        """Get actual POL wallet balance for an address"""
        address = Web3.to_checksum_address(address)
        return self.w3.eth.get_balance(address)

    def get_escrow_total(self) -> int:
        """Get total amount locked in escrow"""
        return self.contract.functions.getEscrowTotal().call()

    def get_fee_percent(self) -> int:
        """Get hardcoded fee percentage (should always be 2)"""
        return self.contract.functions.FEE_PERCENT().call()

    def get_fee_receiver(self) -> str:
        """Get configured fee receiver address"""
        return self.contract.functions.feeReceiver().call()

    def get_server_wallet(self) -> str:
        """Get configured server wallet address"""
        return self.contract.functions.serverWallet().call()


# Global client instance
_blockchain_client = None


def get_blockchain_client() -> BlockchainClient:
    """Get or create blockchain client (singleton)"""
    global _blockchain_client
    if _blockchain_client is None:
        _blockchain_client = BlockchainClient()
    return _blockchain_client
