import { Request, Response } from 'express';
import { EnviosService } from '../services/envios.service';
import Envio from '../models/Envio';
import Respuesta from '../models/Respuesta';
import PuntajeElemento from '../models/PuntajeElemento';
import Persona from '../models/Persona';
import mongoose from 'mongoose';

export const exportEnvios = async (req: Request, res: Response) => {
  try {
    const { envios } = await EnviosService.obtenerEnvios(req.query, 100000, 0); // Traer todo filtrado
    
    const enviosIds = envios.map(e => e._id);
    const respuestas = await Respuesta.find({ envioId: { $in: enviosIds } })
      .populate('aspectoId')
      .populate('preguntaId');
    
    const puntajes = await PuntajeElemento.find({ envioId: { $in: enviosIds } })
      .populate('elementoId');

    const dataset = envios.map((env: any) => {
      const respEnv = respuestas.filter(r => r.envioId.toString() === env._id.toString());
      const puntEnv = puntajes.filter(p => p.envioId.toString() === env._id.toString());

      // Obtener nombre del signo (ya populado en personaId.signoZodiacalId)
      const persona = env.personaId as any;
      const signoNombre = persona?.signoZodiacalId?.nombre ?? persona?.signoZodiacalId ?? 'N/A';

      const row: any = {
        envioId: env._id,
        fecha: env.fechaEnvio,
        nombre: persona?.nombre ?? 'N/A',
        genero: persona?.genero ?? 'N/A',
        signo: signoNombre,
      };

      // Vector de aspectos (1 a 12)
      respEnv.forEach((r: any) => {
        row[`A_${r.aspectoId.nombre.replace(/ /g, '_')}`] = r.valorAspecto;
      });

      // Puntajes de elementos
      puntEnv.forEach((p: any) => {
        row[`E_${p.elementoId.nombre}`] = p.puntajeTotal;
        if (p.esPredominante) {
          row['ElementoPredominante'] = p.elementoId.nombre;
        }
      });

      return row;
    });

    const formato = req.query.formato;
    if (formato === 'csv') {
      if (dataset.length === 0) return res.send('');
      
      const cabeceras = Object.keys(dataset[0]);
      const csvRows = dataset.map(row => cabeceras.map(cab => `"${row[cab]}"`).join(','));
      const csvString = [cabeceras.join(','), ...csvRows].join('\n');
      
      res.header('Content-Type', 'text/csv');
      res.attachment('exportacion_zodiaco.csv');
      return res.send(csvString);
    } else {
      res.json(dataset);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error exportando', error });
  }
};
