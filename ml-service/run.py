import sys
import os
import uvicorn

# Agregar el directorio actual al PYTHONPATH para evitar errores de módulos
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Iniciando Microservicio ML (FastAPI) en http://localhost:8000 ...")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
