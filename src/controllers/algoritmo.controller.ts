import { Request, Response } from 'express';
import axios from 'axios';
import { DataModelService } from '../services/dataModel.service';
import { KMeansRequest, KMeansResponse } from '../models/schema/KMeans.model';
import { HierarchicalRequest, HierarchicalResponse, MetodoEnlace } from '../models/schema/Hierarchical.model';
import Persona from '../models/Persona';
import Pregunta from '../models/Pregunta';
import { PersonaModelService } from '../services/personaModel.service';

const PYTHON_ML_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Llama al microservicio de Python para entrenar el modelo K-Means.
 */
export const trainKMeans = async (data: KMeansRequest): Promise<KMeansResponse> => {
    try {
        const respuesta = await axios.post<KMeansResponse>(`${PYTHON_ML_SERVICE_URL}/train/kmeans`, data);
        return respuesta.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new Error(`Error del servicio ML (${error.response.status}): ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`No se pudo conectar con el servicio de Machine Learning (${PYTHON_ML_SERVICE_URL})`);
        }
        throw error;
    }
};

/**
 * Llama al microservicio de Python para realizar la Clusterización Jerárquica.
 */
export const trainHierarchical = async (data: HierarchicalRequest): Promise<HierarchicalResponse> => {
    try {
        const respuesta = await axios.post<HierarchicalResponse>(`${PYTHON_ML_SERVICE_URL}/train/hierarchical`, data);
        return respuesta.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new Error(`Error del servicio ML (${error.response.status}): ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`No se pudo conectar con el servicio de Machine Learning (${PYTHON_ML_SERVICE_URL})`);
        }
        throw error;
    }
};

/**
 * Llama al microservicio de Python para calcular la Curva del Codo (Elbow Method).
 */
export const trainElbow = async (dataset: any[], kMax: number = 10): Promise<any> => {
    try {
        const respuesta = await axios.post(`${PYTHON_ML_SERVICE_URL}/elbow`, { dataset, kMax });
        return respuesta.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                throw new Error(`Error del servicio ML (${error.response.status}): ${error.response.data.detail || error.response.statusText}`);
            }
            throw new Error(`No se pudo conectar con el servicio de Machine Learning (${PYTHON_ML_SERVICE_URL})`);
        }
        throw error;
    }
};

// ----------------------------- CONTROLLERS EXPRESS -----------------------------

/**
 * Controller para preparar el dataset y obtener los resultados de K-Means.
 */
export const getDataModelKMeans = async (req: Request, res: Response) => {
    try {
        let { ids, questions, k, incluirPCA } = req.body;

        // 1. Cargar personas por defecto si no se especifican
        if (!ids || ids.length === 0) {
            const personas = await Persona.find({}, { _id: 1 });
            ids = personas.map(p => p._id.toString());
        }

        // 2. Cargar preguntas por defecto si no se especifican
        if (!questions || questions.length === 0) {
            const preguntas = await Pregunta.find({}, { _id: 1 });
            questions = preguntas.map(p => p._id.toString());
        }

        // 3. Validar mínimos de dataset
        if (ids.length < 2) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'Se requieren al menos 2 personas en la base de datos para clusterizar.'
            });
        }

        if (questions.length === 0) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'No hay preguntas disponibles para estructurar el dataset.'
            });
        }

        // 4. Validar K
        if (k === undefined || k === null) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'El parámetro K es obligatorio.'
            });
        }

        const kNumero = Number(k);
        if (isNaN(kNumero) || kNumero < 2) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'El número de clusters (K) debe ser un número entero mayor o igual a 2.'
            });
        }

        if (kNumero >= ids.length) {
            return res.status(400).json({
                message: 'Error de validación',
                error: `El valor de K (${kNumero}) debe ser estrictamente menor que la cantidad de registros (${ids.length}).`
            });
        }

        const data = await DataModelService.getSendsKMeans({
            ids,
            questions,
            k: kNumero,
            incluirPCA: Boolean(incluirPCA)
        });
        const result = await trainKMeans(data);

        const personas = await PersonaModelService.getPersonasForML(data.ids, result.labels);

        return res.status(200).json({
            message: 'Entrenamiento K-Means realizado con éxito',
            personas,
            result
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Error en modelo K-Means', error: error.message });
    }
};

/**
 * Controller para preparar el dataset y obtener los resultados de Clusterización Jerárquica.
 */
export const getDataModelHierarchical = async (req: Request, res: Response) => {
    try {
        let { ids, questions, metodoEnlace } = req.body;

        // 1. Cargar personas por defecto si no se especifican
        if (!ids || ids.length === 0) {
            const personas = await Persona.find({}, { _id: 1 });
            ids = personas.map(p => p._id.toString());
        }

        // 2. Cargar preguntas por defecto si no se especifican
        if (!questions || questions.length === 0) {
            const preguntas = await Pregunta.find({}, { _id: 1 });
            questions = preguntas.map(p => p._id.toString());
        }

        // 3. Validaciones de dataset
        if (ids.length < 2) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'Se requieren al menos 2 personas para realizar la clusterización jerárquica.'
            });
        }

        if (questions.length === 0) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'No hay preguntas disponibles para estructurar el dataset.'
            });
        }

        // 4. Validar método de enlace si se proporciona
        const metodosValidos: MetodoEnlace[] = ['ward', 'average', 'complete'];
        if (metodoEnlace && !metodosValidos.includes(metodoEnlace)) {
            return res.status(400).json({
                message: 'Error de validación',
                error: `El método de enlace '${metodoEnlace}' no es válido. Opciones permitidas: ${metodosValidos.join(', ')}.`
            });
        }

        const data = await DataModelService.getSendsHierarchical({
            ids,
            questions,
            metodoEnlace: metodoEnlace || 'ward'
        });

        const result = await trainHierarchical(data);

        return res.status(200).json({
            message: 'Clusterización Jerárquica realizada con éxito',
            result
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Error en Clusterización Jerárquica', error: error.message });
    }
};

/**
 * Controller para calcular el Método del Codo (Elbow Method).
 */
export const getDataModelElbow = async (req: Request, res: Response) => {
    try {
        let { ids, questions, kMax } = req.body;

        if (!ids || ids.length === 0) {
            const personas = await Persona.find({}, { _id: 1 });
            ids = personas.map(p => p._id.toString());
        }

        if (!questions || questions.length === 0) {
            const preguntas = await Pregunta.find({}, { _id: 1 });
            questions = preguntas.map(p => p._id.toString());
        }

        const dataPersons = await DataModelService.setData({ ids, questions });
        if (!dataPersons.dataset || dataPersons.dataset.length < 2) {
            return res.status(400).json({
                message: 'Error de validación',
                error: 'Se requieren al menos 2 personas registradas con respuestas para calcular la curva del codo.'
            });
        }

        const result = await trainElbow(dataPersons.dataset, Number(kMax) || 10);

        return res.status(200).json({
            message: 'Curva del Codo calculada con éxito',
            result
        });
    } catch (error: any) {
        return res.status(400).json({ message: 'Error al calcular la curva del codo', error: error.message });
    }
};