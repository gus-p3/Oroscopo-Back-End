import Pregunta from '../models/Pregunta';

export class CuestionarioService {
  static async obtenerPreguntas() {
    return await Pregunta.aggregate([
      { $sort: { numero: 1 } },
      {
        $lookup: {
          from: 'opcionesRespuesta',
          localField: '_id',
          foreignField: 'preguntaId',
          as: 'opciones'
        }
      },
      {
        $project: {
          numero: 1,
          texto: 1,
          aspectoId: 1,
          opciones: {
            $sortArray: { input: '$opciones', sortBy: { numero: 1 } }
          }
        }
      }
    ]);
  }
}
