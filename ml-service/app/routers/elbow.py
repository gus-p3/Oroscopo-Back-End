"""
Endpoint auxiliar para el método del codo (elbow method).

POST /elbow
Corre K-Means para K = 2 hasta kMax sobre el mismo dataset, y regresa la
inercia de cada corrida para que Angular grafique la curva y el usuario
elija visualmente el mejor K.
"""

from fastapi import APIRouter, HTTPException
from sklearn.cluster import KMeans

from app.preprocessing import DatasetError, construir_matriz_features
from app.schemas import ElbowPoint, ElbowRequest, ElbowResponse

router = APIRouter(tags=["elbow"])


@router.post("/elbow", response_model=ElbowResponse)
def calcular_curva_codo(payload: ElbowRequest) -> ElbowResponse:
    try:
        matriz = construir_matriz_features(payload.dataset)
    except DatasetError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    n_muestras = matriz.shape[0]
    k_maximo_real = min(payload.kMax, n_muestras - 1)
    if k_maximo_real < 2:
        raise HTTPException(
            status_code=400,
            detail="No hay suficientes registros para calcular la curva del codo (se necesitan al menos 3).",
        )

    inercias: list[ElbowPoint] = []
    try:
        for k in range(2, k_maximo_real + 1):
            modelo = KMeans(n_clusters=k, random_state=42, n_init=10)
            modelo.fit(matriz)
            inercias.append(ElbowPoint(k=k, inercia=float(modelo.inertia_)))
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Error al calcular la curva del codo: {exc}") from exc

    return ElbowResponse(inercias=inercias)
