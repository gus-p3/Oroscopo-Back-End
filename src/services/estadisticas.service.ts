import mongoose from 'mongoose';
import Envio from '../models/Envio';
import Respuesta from '../models/Respuesta';
import PuntajeElemento from '../models/PuntajeElemento';
import AspectoPersonalidad from '../models/AspectoPersonalidad';
import SignoZodiacal from '../models/SignoZodiacal';
import Persona from '../models/Persona';
import Elemento from '../models/Elemento';

export class EstadisticasService {
  static async obtenerDashboardStats() {
    // 1. Promedio de cada aspecto (vector promedio)
    const promediosAspectos = await Respuesta.aggregate([
      {
        $group: {
          _id: '$aspectoId',
          promedio: { $avg: '$valorAspecto' }
        }
      },
      {
        $lookup: {
          from: 'aspectosPersonalidad',
          localField: '_id',
          foreignField: '_id',
          as: 'aspectoInfo'
        }
      },
      {
        $unwind: '$aspectoInfo'
      },
      {
        $project: {
          aspectoId: '$_id',
          nombre: '$aspectoInfo.nombre',
          promedio: { $round: ['$promedio', 2] }
        }
      }
    ]);

    // 2. Distribución de elemento predominante
    const distribucionElementos = await PuntajeElemento.aggregate([
      { $match: { esPredominante: true } },
      {
        $group: {
          _id: '$elementoId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'elementos',
          localField: '_id',
          foreignField: '_id',
          as: 'elementoInfo'
        }
      },
      { $unwind: '$elementoInfo' },
      {
        $project: {
          elementoId: '$_id',
          nombre: '$elementoInfo.nombre',
          count: 1
        }
      }
    ]);

    // 3. Distribución de signos vs elemento predominante calculado (coincidencia)
    // Para esto necesitamos join entre PuntajeElemento (predominante) y Persona (signo)
    const coincidenciaSignos = await PuntajeElemento.aggregate([
      { $match: { esPredominante: true } },
      {
        $lookup: {
          from: 'personas',
          localField: 'personaId',
          foreignField: '_id',
          as: 'persona'
        }
      },
      { $unwind: '$persona' },
      {
        $lookup: {
          from: 'signosZodiacales',
          localField: 'persona.signoZodiacalId',
          foreignField: '_id',
          as: 'signo'
        }
      },
      { $unwind: '$signo' },
      // Agrupar por Elemento Calculado y Signo Real
      {
        $group: {
          _id: {
            elementoCalculadoId: '$elementoId',
            signoId: '$signo._id',
            signoNombre: '$signo.nombre',
            elementoDelSignoId: '$signo.elementoId'
          },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          elementoCalculadoId: '$_id.elementoCalculadoId',
          signoNombre: '$_id.signoNombre',
          coincide: { $eq: ['$_id.elementoCalculadoId', '$_id.elementoDelSignoId'] },
          count: 1
        }
      }
    ]);

    const totalEnvios = await Envio.countDocuments({ estado: 'completo' });

    return {
      totalEnvios,
      promediosAspectos,
      distribucionElementos,
      coincidenciaSignos
    };
  }
}
