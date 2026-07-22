"""
Preprocesamiento común para K-Means y Clusterización Jerárquica.

Reglas del proyecto (ver documento de planificación, sección 4.3 / 5):
  - Node.js ya debe excluir del dataset: _id/ObjectId, fechas, textos libres
    y el campo "estado". Aun así, aquí se aplica una limpieza defensiva por
    si algún campo no deseado se cuela.
  - Variables categóricas (ej. genero, signo) se codifican con One-Hot
    Encoding.
  - Todas las columnas numéricas resultantes se estandarizan con
    StandardScaler (media 0, desviación estándar 1), tal como indica el
    documento de planificación para "Puntaje_Fuego", "Puntaje_Tierra", etc.
"""

from typing import List, Sequence

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

# Nombres de columnas que NUNCA deben usarse como feature, incluso si
# llegaran por error desde Node. Es una defensa extra, no la única regla.
COLUMNAS_PROHIBIDAS = {
    "_id", "id", "personaId", "envioId", "elementoId", "preguntaId",
    "signoZodiacalId", "aspectoId", "opcionSeleccionadaId",
    "fechaRegistro", "fechaEnvio", "createdAt", "updatedAt",
    "nombre", "textoRespuestaCualitativa", "descripcion",
    "fortalezas", "retos", "estado",
}


class DatasetError(ValueError):
    """Error de validación de datos, distinto de un error interno del cómputo."""


def construir_matriz_features(dataset: Sequence[dict]) -> np.ndarray:
    """
    Convierte una lista de registros (dict) en una matriz numérica lista
    para K-Means o Clusterización Jerárquica.

    Pasos:
      1. Arma un DataFrame de pandas.
      2. Elimina cualquier columna prohibida que se haya colado.
      3. Aplica One-Hot Encoding a las columnas categóricas (texto/booleanas).
      4. Rellena valores nulos con 0 (evita que scikit-learn falle).
      5. Aplica StandardScaler a toda la matriz resultante.

    Lanza DatasetError si, tras la limpieza, no queda ninguna columna útil.
    """
    if not dataset:
        raise DatasetError("El dataset está vacío")

    df = pd.DataFrame(dataset)

    # Defensa extra: quitar columnas prohibidas si llegaran por error.
    columnas_a_quitar = [c for c in df.columns if c in COLUMNAS_PROHIBIDAS]
    if columnas_a_quitar:
        df = df.drop(columns=columnas_a_quitar)

    if df.shape[1] == 0:
        raise DatasetError(
            "Después de limpiar columnas no permitidas, no quedó ninguna "
            "feature utilizable. Revisa qué está enviando Node.js."
        )

    # One-Hot Encoding de columnas categóricas (texto, booleanas, categorías).
    columnas_categoricas = df.select_dtypes(include=["object", "bool", "category"]).columns.tolist()
    if columnas_categoricas:
        df = pd.get_dummies(df, columns=columnas_categoricas)

    # Asegura que todo lo restante sea numérico; si algo no se pudo convertir,
    # lo fuerza a NaN para poder rellenarlo después.
    df = df.apply(pd.to_numeric, errors="coerce")

    # Rellenar nulos (ej. respuestas faltantes de algún aspecto) con 0.
    df = df.fillna(0)

    if df.shape[1] == 0:
        raise DatasetError("No quedaron columnas numéricas utilizables tras el preprocesamiento")

    matriz = df.to_numpy(dtype=float)

    escalador = StandardScaler()
    matriz_escalada = escalador.fit_transform(matriz)

    return matriz_escalada


def validar_ids_dataset(ids: List[str], dataset: Sequence[dict]) -> None:
    """Valida que 'ids' y 'dataset' tengan la misma longitud (mismo orden)."""
    if len(ids) != len(dataset):
        raise DatasetError(
            f"'ids' tiene {len(ids)} elementos pero 'dataset' tiene {len(dataset)}; "
            "deben tener la misma longitud y el mismo orden."
        )
