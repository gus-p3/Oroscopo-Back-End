# Backend — API REST & Microservicio ML

Servidor backend principal en Node.js + Express + TypeScript e integración con el microservicio de Machine Learning en Python.

## 📁 Estructura
- **`src/`**: Servidor API REST Node.js
  - `controllers/`: Controladores de endpoints (incluye `algoritmo.controller.ts`).
  - `routes/`: Rutas Express (incluye `algoritmo.routes.ts`).
  - `services/`: Lógica de negocio y consultas MongoDB optimizadas (`dataModel.service.ts`, `personaModel.service.ts`).
  - `models/`: Esquemas de Mongoose y tipos TypeScript.
- **`ml-service/`**: Microservicio en Python (FastAPI + Scikit-Learn + SciPy) para procesamiento de algoritmos K-Means y Jerárquico.

---

## ⚡ Instalación y Ejecución

### 1. Backend (Node.js)
```bash
npm install
npm run dev
```
Correrá en **`http://localhost:3000`**.

### 2. Microservicio de ML (Python)
```bash
cd ml-service
pip install -r requirements.txt
py run.py
```
Correrá en **`http://localhost:8000`**.

---

## 🔐 Variables de Entorno (.env)
Crea un archivo `.env` en la raíz de `back-end/`:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/sodiacal_db
PYTHON_ML_SERVICE_URL=http://localhost:8000
```
