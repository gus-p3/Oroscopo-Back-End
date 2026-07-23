import { Router } from 'express';
import { 
  getDataModelKMeans, 
  getDataModelHierarchical,
  getDataModelElbow
} from '../controllers/algoritmo.controller';

const router = Router();

/**
 * @route   POST /api/algoritmo/kmeans
 * @desc    Genera el dataset y ejecuta el algoritmo K-Means
 */
router.post('/kmeans', getDataModelKMeans);

/**
 * @route   POST /api/algoritmo/jerarquico
 * @desc    Genera el dataset y ejecuta la Clusterización Jerárquica
 */
router.post('/jerarquico', getDataModelHierarchical);

/**
 * @route   POST /api/algoritmo/elbow
 * @desc    Calcula la curva del codo para determinar el K óptimo
 */
router.post('/elbow', getDataModelElbow);

export default router;
