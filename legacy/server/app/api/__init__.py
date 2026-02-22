"""
API routes for Buster Server

Provides REST endpoints for:
- Bet placement and joining
- Game interaction
- Player information
- Contract queries
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
import httpx
import asyncio
from app.blockchain import get_blockchain_client
from app.game import DiceGame
from app.matching import get_matchmaking_queue
from app.randomness import DrandClientSync
from app.utils import validate_eth_address, from_wei, to_wei

router = APIRouter(prefix="/api", tags=["api"])

# ============ Price Cache ============

_price_cache = {
    "pol_price": 0.11,
    "usdc_price": 1.0,
    "source": "initializing"
}

async def _fetch_prices_from_coingecko():
    """Fetch latest prices from CoinGecko and update cache."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                'https://api.coingecko.com/api/v3/simple/price?ids=pol-ex-matic,usd-coin&vs_currencies=usd',
                timeout=10.0
            )
            if response.status_code == 200:
                data = response.json()
                pol = data.get('pol-ex-matic', {}).get('usd')
                usdc = data.get('usd-coin', {}).get('usd')
                if pol is not None:
                    _price_cache['pol_price'] = pol
                if usdc is not None:
                    _price_cache['usdc_price'] = usdc
                _price_cache['source'] = 'coingecko'
                print(f"[prices] Updated: POL=${_price_cache['pol_price']}, USDC=${_price_cache['usdc_price']}")
            else:
                print(f"[prices] CoinGecko returned {response.status_code}")
    except Exception as e:
        print(f"[prices] Fetch failed: {e}")

async def start_price_updater():
    """Background task: fetch prices immediately, then every 30 seconds."""
    while True:
        await _fetch_prices_from_coingecko()
        await asyncio.sleep(30)


# ============ Pydantic Models ============


class PlaceBetRequest(BaseModel):
    """Request to place a bet"""

    player_address: str = Field(..., description="Player's wallet address")
    amount: float = Field(..., gt=0, description="Bet amount in MATIC")
    game_type: str = Field(default="dice", description="Type of game")


class PlaceBetResponse(BaseModel):
    """Response after placing a bet"""

    status: str
    message: str
    betId: int
    player_address: str
    amount: float
    game_type: str


class JoinBetRequest(BaseModel):
    """Request to join a pending bet"""

    player_address: str = Field(..., description="Player's wallet address")
    bet_id: int = Field(..., description="ID of bet to join")


class PlayGameRequest(BaseModel):
    """Request to play a game (dice roll)"""

    player_address: str = Field(..., description="Player's wallet address")
    bet_id: int = Field(..., description="ID of active game")


class GameResultResponse(BaseModel):
    """Game result"""

    status: str
    message: str
    bet_id: int
    player1_roll: int
    player2_roll: int
    winner_is_player: int
    tx_hash: str = None


class BetDetailsResponse(BaseModel):
    """Details of a bet"""

    bet_id: int
    player1: str
    player2: str
    amount: float
    status: str
    winner: str = None
    game_type: str


class PlayerStatsResponse(BaseModel):
    """Player statistics"""

    address: str
    claimable_balance: float
    balance_wei: int
    wallet_balance: float
    wallet_balance_wei: int


# ============ Routes ============


@router.post("/bet/place", response_model=PlaceBetResponse)
async def place_bet(request: PlaceBetRequest):
    """
    Player 1 places a bet. Contract receives funds immediately.

    Returns betId that Player 2 uses to join.
    """
    # Validate
    if not validate_eth_address(request.player_address):
        raise HTTPException(status_code=400, detail="Invalid player address")

    if request.amount <= 0:
        raise HTTPException(status_code=400, detail="Bet amount must be positive")

    # NOTE: In production, you would:
    # 1. Validate the player's MetaMask signature
    # 2. Call contract.placeBet() via frontend
    # 3. Just track the bet ID here

    # For now, this is a placeholder response
    return PlaceBetResponse(
        status="pending",
        message="Bet placed. Waiting for opponent. Use the betId to watch for matches.",
        betId=1,  # Would come from contract event
        player_address=request.player_address,
        amount=request.amount,
        game_type=request.game_type,
    )


@router.post("/bet/join", response_model=PlaceBetResponse)
async def join_bet(request: JoinBetRequest):
    """
    Player 2 joins an existing pending bet with same amount.

    Contract receives second player's funds. Bet becomes Active.
    """
    if not validate_eth_address(request.player_address):
        raise HTTPException(status_code=400, detail="Invalid player address")

    # NOTE: In production, contract.joinBet() called via frontend
    # Server just tracks it

    return PlaceBetResponse(
        status="active",
        message="Joined bet! Game starting shortly.",
        betId=request.bet_id,
        player_address=request.player_address,
        amount=0,  # Retrieved from contract
        game_type="dice",
    )


@router.post("/game/play", response_model=GameResultResponse)
async def play_game(request: PlayGameRequest):
    """
    Play a game using Drand randomness and settle on-chain.

    Flow:
    1. Fetch latest Drand randomness
    2. Derive game outcome deterministically
    3. Call contract.settleWagerWithDrand()
    4. Return result (fully verifiable)

    The outcome is 100% determined by Drand - neither server nor players can manipulate it.
    Anyone can verify by checking drandbeacon.io for the same Drand round.
    """
    if not validate_eth_address(request.player_address):
        raise HTTPException(status_code=400, detail="Invalid player address")

    bc_client = get_blockchain_client()

    # Get bet details from contract
    try:
        bet = bc_client.get_bet(request.bet_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Bet not found: {str(e)}")

    # Validate bet is active
    if bet["status"] != 1:  # Active
        raise HTTPException(status_code=400, detail="Bet is not active")

    # Fetch latest Drand randomness
    try:
        drand_client = DrandClientSync(use_mainchain=True)
        drand_data = drand_client.get_latest()
        drand_round = drand_data["round"]
        drand_randomness_hex = drand_data["randomness"]
        drand_value = drand_client.randomness_to_int(drand_randomness_hex)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch Drand: {str(e)}")

    # Derive game outcome from Drand (deterministic, verifiable)
    game_result = DiceGame.derive_rolls_from_drand(drand_value)

    # Settle on-chain with Drand parameters
    # Winner is derived on-chain from drand_value, so we don't pass it
    try:
        tx_result = bc_client.settle_wager_with_drand(
            bet_id=request.bet_id,
            drand_round=drand_round,
            drand_value=drand_value,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Settlement failed: {str(e)}")

    return GameResultResponse(
        status="settled",
        message=game_result["message"],
        bet_id=request.bet_id,
        player1_roll=game_result["player1_roll"],
        player2_roll=game_result["player2_roll"],
        winner_is_player=game_result["winner"],
        tx_hash=tx_result["tx_hash"],
    )


@router.get("/bet/{bet_id}", response_model=BetDetailsResponse)
async def get_bet(bet_id: int):
    """Get details of a specific bet"""
    bc_client = get_blockchain_client()

    try:
        bet = bc_client.get_bet(bet_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail="Bet not found")

    status_names = ["Pending", "Active", "Settled", "Canceled"]

    return BetDetailsResponse(
        bet_id=bet["betId"],
        player1=bet["player1"],
        player2=bet["player2"],
        amount=from_wei(bet["amount"]),
        status=status_names[bet["status"]],
        winner=bet["winner"] if bet["winner"] != "0x0000000000000000000000000000000000000000" else None,
        game_type=bet["gameType"],
    )


@router.get("/player/{address}", response_model=PlayerStatsResponse)
async def get_player_stats(address: str):
    """Get player statistics and balance"""
    if not validate_eth_address(address):
        raise HTTPException(status_code=400, detail="Invalid address")

    bc_client = get_blockchain_client()

    try:
        balance_wei = bc_client.get_balance(address)
        wallet_balance_wei = bc_client.get_wallet_balance(address)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return PlayerStatsResponse(
        address=address,
        claimable_balance=from_wei(balance_wei),
        balance_wei=balance_wei,
        wallet_balance=from_wei(wallet_balance_wei),
        wallet_balance_wei=wallet_balance_wei,
    )


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    bc_client = get_blockchain_client()

    try:
        fee_percent = bc_client.get_fee_percent()
        escrow = bc_client.get_escrow_total()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "healthy",
        "contract_address": bc_client.contract.address,
        "fee_percent": fee_percent,
        "escrow_total_wei": escrow,
        "escrow_total_matic": from_wei(escrow),
    }


@router.get("/contract/info")
async def contract_info():
    """Get contract configuration"""
    bc_client = get_blockchain_client()

    try:
        fee_receiver = bc_client.get_fee_receiver()
        server_wallet = bc_client.get_server_wallet()
        fee_percent = bc_client.get_fee_percent()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "contract_address": bc_client.contract.address,
        "fee_receiver": fee_receiver,
        "server_wallet": server_wallet,
        "fee_percent": fee_percent,
    }


@router.get("/queue/status")
async def queue_status():
    """Get matchmaking queue status"""
    queue = get_matchmaking_queue()
    return queue.get_queue_status()


@router.get("/prices")
async def get_prices():
    """Return cached POL and USDC prices (updated every 30s from CoinGecko)"""
    return _price_cache
