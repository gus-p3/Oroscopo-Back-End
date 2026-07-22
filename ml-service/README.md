# Servicio ML — Clustering Zodiacal (K-Means y Clusterización Jerárquica)

Microservicio en Python (FastAPI) responsable de entrenar y ejecutar los dos
algoritmos de aprendizaje no supervisado del proyecto: **K-Means** y
**Clusterización Jerárquica**. Es consumido por el backend de Node.js/Express
— nunca por Angular directamente ni por MongoDB.

## Requisitos

- Python 3.10 o superior
- pip

## Instalación

```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # En Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Ajusta ALLOWED_ORIGINS si hace falta
```

## Levantar el servicio en local

```bash
uvicorn app.main:app --reload --port 8000
```

Una vez arriba:
- Health check: `GET http://localhost:8000/health`
- Documentación interactiva (Swagger UI): `http://localhost:8000/docs`

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Confirma que el servicio está vivo |
| POST | `/train/kmeans` | Entrena K-Means (labels, centroides, inercia, PCA opcional) |
| POST | `/elbow` | Calcula la curva del codo (inercia por cada K) |
| POST | `/train/hierarchical` | Calcula la matriz de enlace para el dendrograma |

Los contratos completos de request/response de cada endpoint están
documentados como docstrings en cada archivo dentro de `app/routers/`, y
también se pueden probar directamente desde `/docs`.

## Ejemplo rápido de prueba con curl

```bash
curl -X POST http://localhost:8000/train/kmeans \
  -H "Content-Type: application/json" \
  -d '{
    "dataset": [
      {"is_Femenino": 1, "is_Masculino": 0, "Puntaje_Fuego": 45, "Puntaje_Tierra": 10, "Puntaje_Aire": 8, "Puntaje_Agua": 12},
      {"is_Femenino": 0, "is_Masculino": 1, "Puntaje_Fuego": 5,  "Puntaje_Tierra": 40, "Puntaje_Aire": 9, "Puntaje_Agua": 11}
    ],
    "ids": ["persona1", "persona2"],
    "k": 2,
    "incluirPCA": true
  }'
```

## Reglas de preprocesamiento (importante para quien consuma este servicio)

Antes de enviar el `dataset`, el backend de Node.js debe:
- **Excluir**: todos los `_id`/ObjectId, fechas (`fechaRegistro`, `fechaEnvio`,
  `createdAt`, `updatedAt`), textos libres (`nombre`,
  `textoRespuestaCualitativa`, `descripcion`, `fortalezas`, `retos`) y el
  campo `estado`.
- **Incluir**: género y signo zodiacal (ya sea crudos como texto —
  este servicio aplica One-Hot Encoding automáticamente — o ya codificados
  desde Node), y los puntajes numéricos por elemento
  (`Puntaje_Fuego`, `Puntaje_Tierra`, `Puntaje_Aire`, `Puntaje_Agua`).

Este servicio aplica, de forma defensiva, una limpieza adicional de columnas
prohibidas (ver `app/preprocessing.py`), pero la responsabilidad principal de
armar el dataset limpio es del backend de Node.js.

## Estructura de carpetas

```
ml-service/
├── app/
│   ├── main.py              # Punto de entrada de FastAPI + CORS
│   ├── schemas.py           # Modelos Pydantic (contratos de entrada/salida)
│   ├── preprocessing.py     # One-Hot Encoding + StandardScaler
│   └── routers/
│       ├── health.py
│       ├── kmeans.py
│       ├── elbow.py
│       └── hierarchical.py
├── requirements.txt
├── .env.example
└── README.md
```

## Manejo de errores

- **HTTP 400**: dataset vacío, con menos de 2 registros, `ids` y `dataset`
  con longitudes distintas, o K mayor/igual al número de registros.
- **HTTP 500**: error interno durante el entrenamiento o el cálculo de PCA
  (el detalle del error se incluye en la respuesta para facilitar debug
  durante el desarrollo).
