import { Request, Response } from 'express';
import { CuestionarioService } from '../services/cuestionario.service';
import { EnviosService } from '../services/envios.service';
import { EstadisticasService } from '../services/estadisticas.service';
import Elemento from '../models/Elemento';
import SignoZodiacal from '../models/SignoZodiacal';

export const getCuestionario = async (req: Request, res: Response) => {
  try {
    const preguntas = await CuestionarioService.obtenerPreguntas();
    res.json(preguntas);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo cuestionario', error });
  }
};

export const getCatalogos = async (req: Request, res: Response) => {
  try {
    const signos = await SignoZodiacal.find().populate('elementoId');
    const elementos = await Elemento.find();
    res.json({ signos, elementos });
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo catálogos', error });
  }
};

export const createEnvio = async (req: Request, res: Response) => {
  try {
    const result = await EnviosService.crearEnvio(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(400).json({ message: 'Error creando envío', error: error.message });
  }
};

export const getEnvios = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const result = await EnviosService.obtenerEnvios(req.query, limit, skip);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo envíos', error });
  }
};

export const getEnvioById = async (req: Request, res: Response) => {
  try {
    const result = await EnviosService.obtenerDetalleEnvio(req.params.id as string);
    res.json(result);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getEstadisticas = async (req: Request, res: Response) => {
  try {
    const stats = await EstadisticasService.obtenerDashboardStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error obteniendo estadísticas', error });
  }
};
