# Oroscopo-Back-End

API REST del sistema de Cuestionario de Personalidad Zodiacal.

## Stack
- Node.js + Express + TypeScript
- MongoDB + Mongoose (9 colecciones normalizadas)
- Arquitectura en capas: routes / controllers / services / models

## Instalación

```bash
npm install
```

## Base de datos — Seed inicial

```bash
npx tsx src/scripts/seed.ts
```

## Desarrollo (recarga automática)

```bash
npm run dev
```

## Producción

```bash
npm run build
npm start
```

El servidor corre en `http://localhost:3000`.

## Variables de entorno

Crea un archivo `.env` en la raíz con:

```
MONGO_URI=mongodb://127.0.0.1:27017/zodiacal
PORT=3000
```
