import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Middleware para ver todas las peticiones HTTP entrantes en la consola
app.use((req, res, next) => {
    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
        const duration = Date.now() - start;
        const status = res.statusCode;
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 🚀 ${method} ${originalUrl} -> ${status} (${duration}ms)`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log(`   📦 Body:`, JSON.stringify(req.body));
        }
    });

    next();
});

app.use('/api', apiRoutes);

const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sodiacal_db';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Conectado');
    
    app.listen(port, () => {
      console.log(`Backend escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor', error);
  }
};

startServer();