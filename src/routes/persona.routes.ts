
import { Router } from 'express';
import { getPersonaPersonalidadID } from '../controllers/persona.controller';


const router = Router();
/**
 * @route   POST /api/algoritmo/jerarquico
 * @desc    Genera el dataset y ejecuta la Clusterización Jerárquica
 */
router.get('/:id', getPersonaPersonalidadID);
export default router;