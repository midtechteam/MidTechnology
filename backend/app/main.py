import sys
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import projects, exports, health

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("Scafbind API starting up...")
    yield
    # Shutdown tasks
    print("Scafbind API shutting down...")

app = FastAPI(
    title="Scafbind API",
    description="Backend API for Scafbind SaaS Wireframing and Design Tool",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred.", "type": type(exc).__name__},
    )

# Include Routers
app.include_router(health.router, tags=["Health"])
app.include_router(projects.router, prefix="/api/v1", tags=["Projects"])
app.include_router(exports.router, prefix="/api/v1", tags=["Exports"])

@app.get("/")
async def root():
    return {
        "app": "Scafbind API",
        "version": "0.1.0",
        "status": "online",
        "docs": "/docs",
    }
