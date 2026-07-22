"""
Endpoint de Clusterización Jerárquica (Hierarchical Clustering).

POST /train/hierarchical
Recibe el dataset y el método de enlace (ward, average o complete), calcula
la matriz de enlace (linkage matrix) con scipy, y la regresa completa para
que Angular dibuje el dendrograma y permita mover el "corte" sin volver a
llamar al backend en cada movimiento.
"""

from fastapi import APIRouter, HTTPException
from scipy.cluster.hierarchy import linkage

from app.preprocessing import DatasetError, construir_matriz_features, validar_ids_dataset
from app.schemas import HierarchicalRequest, HierarchicalResponse

router = APIRouter(tags=["hierarchical"])


@router.post("/train/hierarchical", response_model=HierarchicalResponse)
def entrenar_jerarquico(payload: HierarchicalRequest) -> HierarchicalResponse:
    try:
        validar_ids_dataset(payload.ids, payload.dataset)
        matriz = construir_matriz_features(payload.dataset)
    except DatasetError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        # scipy.cluster.hierarchy.linkage regresa una matriz (n-1) x 4:
        # [idx_cluster_1, idx_cluster_2, distancia, num_elementos_en_nuevo_cluster]
        matriz_enlace = linkage(matriz, method=payload.metodoEnlace)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=500,
            detail=f"Error al calcular la clusterización jerárquica: {exc}",
        ) from exc

    return HierarchicalResponse(
        linkageMatrix=matriz_enlace.tolist(),
        labelsOrden=payload.ids,
    )
