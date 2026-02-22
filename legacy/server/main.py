"""
Buster Server - Main Entry Point

A FastAPI server for the Buster P2P betting protocol on Polygon.
"""

import logging
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import router as api_router
from app.api import start_price_updater
from app.blockchain import get_blockchain_client

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Buster Server",
    description="P2P Betting Protocol on Polygon",
    version="0.1.0",
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)


@app.on_event("startup")
async def startup_event():
    """Initialize blockchain connection on startup"""
    logger.info("Starting Buster Server...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"Debug mode: {settings.debug}")

    try:
        bc_client = get_blockchain_client()
        fee_percent = bc_client.get_fee_percent()
        logger.info(f"Connected to contract: {bc_client.contract.address}")
        logger.info(f"Fee percent: {fee_percent}%")
        logger.info("Blockchain client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize blockchain client: {e}")
        raise

    # Start background price updater (CoinGecko, every 30 seconds)
    asyncio.create_task(start_price_updater())
    logger.info("Price updater background task started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down Buster Server...")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Buster Server",
        "version": "0.1.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "contract": "/api/contract/info",
            "docs": "/docs",
            "openapi": "/openapi.json",
        },
    }


@app.get("/stats")
async def stats():
    """Get server statistics"""
    try:
        bc_client = get_blockchain_client()
        escrow = bc_client.get_escrow_total()
        fee_receiver = bc_client.get_fee_receiver()

        return {
            "status": "active",
            "escrow_total_wei": escrow,
            "escrow_total_matic": escrow / (10 ** 18),
            "fee_receiver": fee_receiver,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="debug" if settings.debug else "info",
    )
