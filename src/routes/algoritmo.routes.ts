import { Router } from 'express';
import { 
  getDataModelKMeans, 
  getDataModelHierarchical 
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

export default router;
