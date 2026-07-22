"""
Endpoint de entrenamiento K-Means.

POST /train/kmeans
Recibe un dataset ya armado por Node.js + un valor de K, entrena K-Means con
scikit-learn y regresa las etiquetas de cluster, los centroides, la inercia,
y (opcionalmente) la proyección a 2 dimensiones vía PCA para poder graficar
un scatter plot aunque el dataset tenga más de 2 variables.
"""

from fastapi import APIRouter, HTTPException
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA

from app.preprocessing import DatasetError, construir_matriz_features, validar_ids_dataset
from app.schemas import KMeansRequest, KMeansResponse

router = APIRouter(tags=["kmeans"])


@router.post("/train/kmeans", response_model=KMeansResponse)
def entrenar_kmeans(payload: KMeansRequest) -> KMeansResponse:
    try:
        validar_ids_dataset(payload.ids, payload.dataset)
        matriz = construir_matriz_features(payload.dataset)
    except DatasetError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    n_muestras = matriz.shape[0]
    if payload.k >= n_muestras:
        raise HTTPException(
            status_code=400,
            detail=(
                f"K={payload.k} debe ser menor que el número de registros "
                f"({n_muestras}). Elige un K más pequeño."
            ),
        )

    try:
        modelo = KMeans(n_clusters=payload.k, random_state=42, n_init=10)
        labels = modelo.fit_predict(matriz)
    except Exception as exc:  # noqa: BLE001 - error interno de cómputo
        raise HTTPException(status_code=500, detail=f"Error al entrenar K-Means: {exc}") from exc

    pca2d = None
    if payload.incluirPCA:
        try:
            n_componentes = min(2, matriz.shape[1])
            pca = PCA(n_components=n_componentes, random_state=42)
            proyeccion = pca.fit_transform(matriz)
            if n_componentes == 1:
                # Si solo hay 1 dimensión útil, se completa con una columna de ceros.
                import numpy as np
                proyeccion = np.column_stack([proyeccion, np.zeros(len(proyeccion))])
            pca2d = proyeccion.tolist()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=500, detail=f"Error al calcular PCA: {exc}") from exc

    return KMeansResponse(
        labels=labels.tolist(),
        centroides=modelo.cluster_centers_.tolist(),
        inercia=float(modelo.inertia_),
        pca2d=pca2d,
    )
