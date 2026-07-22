"""
Esquemas Pydantic (contratos de entrada/salida) del microservicio de Machine
Learning. Estos modelos son la fuente de verdad de qué debe enviar Node.js
y qué va a recibir de vuelta.
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

# Tipo genérico para una fila del dataset ya armado por Node.js.
# Cada registro es un diccionario { "nombre_columna": valor }.
DatasetRow = Dict[str, Any]

MetodoEnlace = Literal["ward", "average", "complete"]


# ----------------------------- K-MEANS -----------------------------

class KMeansRequest(BaseModel):
    dataset: List[DatasetRow] = Field(..., description="Filas ya armadas por Node (una por persona)")
    ids: List[str] = Field(..., description="personaId en el mismo orden que las filas de dataset")
    k: int = Field(..., ge=2, description="Número de clusters deseado (K >= 2)")
    incluirPCA: bool = Field(default=False, description="Si True, regresa proyección 2D vía PCA")

    @field_validator("dataset")
    @classmethod
    def dataset_no_vacio(cls, v: List[DatasetRow]) -> List[DatasetRow]:
        if len(v) < 2:
            raise ValueError("El dataset debe tener al menos 2 registros")
        return v


class KMeansResponse(BaseModel):
    labels: List[int]
    centroides: List[List[float]]
    inercia: float
    pca2d: Optional[List[List[float]]] = None


# ----------------------------- ELBOW (método del codo) -----------------------------

class ElbowRequest(BaseModel):
    dataset: List[DatasetRow]
    kMax: int = Field(default=10, ge=2, le=30)

    @field_validator("dataset")
    @classmethod
    def dataset_no_vacio(cls, v: List[DatasetRow]) -> List[DatasetRow]:
        if len(v) < 2:
            raise ValueError("El dataset debe tener al menos 2 registros")
        return v


class ElbowPoint(BaseModel):
    k: int
    inercia: float


class ElbowResponse(BaseModel):
    inercias: List[ElbowPoint]


# ----------------------------- CLUSTERIZACIÓN JERÁRQUICA -----------------------------

class HierarchicalRequest(BaseModel):
    dataset: List[DatasetRow]
    ids: List[str] = Field(..., description="personaId en el mismo orden que las filas de dataset")
    metodoEnlace: MetodoEnlace = Field(default="ward")

    @field_validator("dataset")
    @classmethod
    def dataset_no_vacio(cls, v: List[DatasetRow]) -> List[DatasetRow]:
        if len(v) < 2:
            raise ValueError("El dataset debe tener al menos 2 registros")
        return v


class HierarchicalResponse(BaseModel):
    linkageMatrix: List[List[float]]
    labelsOrden: List[str]


# ----------------------------- SALUD -----------------------------

class HealthResponse(BaseModel):
    status: str = "ok"
