import { Router } from 'express';
import { 
  getCuestionario, 
  getCatalogos, 
  createEnvio, 
  getEnvios, 
  getEnvioById, 
  getEstadisticas 
} from '../controllers/api.controller';
import { exportEnvios } from '../controllers/export.controller';
import algoritmoRoutes from './algoritmo.routes';
import Joi from 'joi';

const router = Router();

// Middlewares de validación básicos
const validateEnvio = (req: any, res: any, next: any) => {
  const schema = Joi.object({
    nombre: Joi.string().required(),
    genero: Joi.string().valid('Femenino', 'Masculino', 'Otro', 'Prefiero no decir').required(),
    signoZodiacalId: Joi.string().required(),
    respuestas: Joi.array().items(
      Joi.object({
        preguntaId: Joi.string().required(),
        opcionId: Joi.string().required()
      })
    ).length(12).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: 'Validación fallida', details: error.details });
  }
  next();
};

router.get('/cuestionario', getCuestionario);
router.get('/catalogos', getCatalogos);
router.post('/envios', validateEnvio, createEnvio);
router.get('/envios/exportar', exportEnvios);
router.get('/envios/:id', getEnvioById); // Otener detalles del envio
router.get('/envios', getEnvios);
router.get('/estadisticas', getEstadisticas);

// Rutas de los algoritmos de Machine Learning
router.use('/algoritmo', algoritmoRoutes);

export default router;
