"""
Microservicio de Machine Learning (K-Means y Clusterización Jerárquica).

Este servicio NO conoce MongoDB ni Express directamente: solo recibe JSON
con un dataset ya armado por el backend de Node.js, entrena/calcula con
scikit-learn y scipy, y regresa JSON.

Para levantarlo en local:
    uvicorn app.main:app --reload --port 8000

Documentación interactiva automática (Swagger UI) disponible en:
    http://localhost:8000/docs
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import elbow, health, hierarchical, kmeans

app = FastAPI(
    title="Servicio ML — Clustering Zodiacal",
    description=(
        "Microservicio de entrenamiento para K-Means y Clusterización "
        "Jerárquica sobre datos de personalidad zodiacal."
    ),
    version="1.0.0",
)

# CORS: permite que el backend de Node.js (y, en desarrollo, Angular
# directamente si se necesitara) llame a este servicio sin bloqueos del
# navegador. En producción, restringe ALLOWED_ORIGINS a la URL real del
# backend de Node.
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(kmeans.router)
app.include_router(elbow.router)
app.include_router(hierarchical.router)

if __name__ == "__main__":
    import uvicorn
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

