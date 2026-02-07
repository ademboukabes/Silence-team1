"""
FastAPI Application Entry Point

Main application with proper lifecycle management for HTTP clients.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown for HTTP clients.
    """
    # Startup
    logger.info("AI Service starting up...")
    
    # Initialize HTTP clients at startup to ensure they're ready
    try:
        from app.tools import nest_client
        # Force client initialization
        _ = nest_client.get_client()
        logger.info(f"✅ Initialized NestJS client (backend: {nest_client.NEST_BACKEND_URL})")
    except Exception as e:
        logger.error(f"❌ Failed to initialize nest_client: {e}")
    
    try:
        from app.tools import booking_service_client
        _ = booking_service_client.get_client()
        logger.info("✅ Initialized Booking Service client")
    except Exception as e:
        logger.warning(f"Booking Service client not available: {e}")
    
    try:
        from app.tools import carrier_service_client
        _ = carrier_service_client.get_client()
        logger.info("✅ Initialized Carrier Service client")
    except Exception as e:
        logger.warning(f"Carrier Service client not available: {e}")
    
    try:
        from app.tools import slot_service_client
        _ = slot_service_client.get_client()
        logger.info("✅ Initialized Slot Service client")
    except Exception as e:
        logger.warning(f"Slot Service client not available: {e}")
    
    logger.info("AI Service startup complete")
    
    yield
    
    # Shutdown - close all HTTP clients gracefully
    logger.info("AI Service shutting down...")
    
    try:
        from app.tools import nest_client
        await nest_client.aclose_client()
        logger.info("Closed NestJS client")
    except Exception as e:
        logger.error(f"Error closing nest_client: {e}")
    
    try:
        from app.tools import booking_service_client
        await booking_service_client.aclose_client()
        logger.info("Closed Booking Service client")
    except Exception as e:
        logger.error(f"Error closing booking_service_client: {e}")
    
    try:
        from app.tools import booking_write_client
        await booking_write_client.aclose_client()
        logger.info("Closed Booking Write client")
    except Exception as e:
        logger.error(f"Error closing booking_write_client: {e}")
    
    try:
        from app.tools import carrier_service_client
        await carrier_service_client.aclose_client()
        logger.info("Closed Carrier Service client")
    except Exception as e:
        logger.error(f"Error closing carrier_service_client: {e}")
    
    try:
        from app.tools import slot_service_client
        await slot_service_client.aclose_client()
        logger.info("Closed Slot Service client")
    except Exception as e:
        logger.error(f"Error closing slot_service_client: {e}")
    
    try:
        from app.tools import blockchain_service_client
        await blockchain_service_client.aclose_client()
        logger.info("Closed Blockchain Service client")
    except Exception as e:
        logger.error(f"Error closing blockchain_service_client: {e}")
    
    try:
        from app.tools import analytics_data_client
        await analytics_data_client.aclose_client()
        logger.info("Closed Analytics Data client")
    except Exception as e:
        logger.error(f"Error closing analytics_data_client: {e}")
    
    try:
        from app.tools import stt_service_client
        await stt_service_client.aclose_client()
        logger.info("Closed STT Service client")
    except Exception as e:
        logger.error(f"Error closing stt_service_client: {e}")
    
    logger.info("AI Service shutdown complete")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="AI Service - Truck Booking Management",
    description="Intelligent chatbot for smart port operations",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
try:
    from app.api.chat import router as chat_router
    app.include_router(chat_router, prefix="/api", tags=["chat"])
    logger.info("Registered chat router")
except ImportError as e:
    logger.warning(f"Could not import chat router: {e}")



try:
    from app.api.analytics import router as analytics_router
    app.include_router(analytics_router, prefix="/api", tags=["analytics"])
    logger.info("Registered analytics router")
except ImportError as e:
    logger.warning(f"Could not import analytics router: {e}")

try:
    from app.api.stt import router as stt_router
    app.include_router(stt_router, prefix="/api/stt", tags=["stt"])
    logger.info("Registered STT router")
except ImportError as e:
    logger.warning(f"Could not import STT router: {e}")

try:
    from app.api.chat_voice import router as chat_voice_router
    app.include_router(chat_voice_router, prefix="/api/chat", tags=["chat"])
    logger.info("Registered voice chat router")
except ImportError as e:
    logger.warning(f"Could not import voice chat router: {e}")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "AI Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "ai_service",
        "components": {
            "api": "ok",
            "orchestrator": "ok"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
