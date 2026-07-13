import mongoose from 'mongoose';
import Persona from '../models/Persona';
import Envio from '../models/Envio';
import Respuesta from '../models/Respuesta';
import PuntajeElemento from '../models/PuntajeElemento';
import OpcionRespuesta from '../models/OpcionRespuesta';
import Pregunta from '../models/Pregunta';
import AspectoPersonalidad from '../models/AspectoPersonalidad';
import Elemento from '../models/Elemento';

export interface IRespuestaInput {
  preguntaId: string;
  opcionId: string;
}

export interface IEnvioInput {
  nombre: string;
  genero: string;
  signoZodiacalId: string;
  respuestas: IRespuestaInput[];
}

export class EnviosService {
  static async crearEnvio(data: IEnvioInput) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // 1. Crear Persona
      const persona = new Persona({
        nombre: data.nombre,
        genero: data.genero,
        signoZodiacalId: data.signoZodiacalId
      });
      await persona.save({ session });

      // 2. Crear Envio
      const envio = new Envio({
        personaId: persona._id,
        estado: data.respuestas.length === 12 ? 'completo' : 'incompleto'
      });
      await envio.save({ session });

      // Puntos acumulados por elemento
      // Inicializar en 0
      const elementos = await Elemento.find().session(session);
      const puntajesMap: Record<string, number> = {};
      elementos.forEach(el => {
        puntajesMap[el._id.toString()] = 0;
      });

      const respuestasParaInsertar = [];
      const vectorAspectos = [];

      // 3. Procesar las 12 respuestas
      for (const resp of data.respuestas) {
        const opcion = await OpcionRespuesta.findById(resp.opcionId).session(session);
        const pregunta = await Pregunta.findById(resp.preguntaId).session(session);
        
        if (!opcion || !pregunta) {
          throw new Error(`Datos inválidos para preguntaId: ${resp.preguntaId}`);
        }

        const aspecto = await AspectoPersonalidad.findById(pregunta.aspectoId).session(session);
        if (!aspecto) {
          throw new Error(`Aspecto no encontrado para preguntaId: ${resp.preguntaId}`);
        }

        respuestasParaInsertar.push({
          envioId: envio._id,
          preguntaId: pregunta._id,
          aspectoId: aspecto._id,
          opcionSeleccionadaId: opcion._id,
          valorAspecto: opcion.valor,
          textoRespuestaCualitativa: opcion.texto
        });

        vectorAspectos.push({
          aspectoId: aspecto._id.toString(),
          nombre: aspecto.nombre,
          valor: opcion.valor
        });

        // Sumar al dueño (+valor)
        puntajesMap[aspecto.elementoDuenioId.toString()] += opcion.valor;
        // Sumar al par (+1)
        puntajesMap[aspecto.elementoParId.toString()] += 1;
      }

      await Respuesta.insertMany(respuestasParaInsertar, { session });

      // 4. Calcular puntajes por elemento y predominante
      let maxPuntaje = -1;
      let predominanteId = '';

      for (const elId of Object.keys(puntajesMap)) {
        if (puntajesMap[elId] > maxPuntaje) {
          maxPuntaje = puntajesMap[elId];
          predominanteId = elId;
        }
      }

      const puntajesParaInsertar = Object.keys(puntajesMap).map(elId => ({
        envioId: envio._id,
        personaId: persona._id,
        elementoId: elId,
        puntajeTotal: puntajesMap[elId],
        esPredominante: elId === predominanteId
      }));

      await PuntajeElemento.insertMany(puntajesParaInsertar, { session });

      await session.commitTransaction();
      session.endSession();

      // Enriquecer con los nombres de los elementos para mostrarlo en el frontend
      const elementosMap: Record<string, string> = {};
      elementos.forEach(el => {
        elementosMap[el._id.toString()] = el.nombre;
      });

      const puntajesEnriquecidos = puntajesParaInsertar.map(p => ({
        ...p,
        elementoNombre: elementosMap[p.elementoId] ?? p.elementoId
      }));

      return {
        vectorAspectos,
        puntajesElemento: puntajesEnriquecidos,
        elementoPredominanteId: predominanteId,
        elementoPredominanteNombre: elementosMap[predominanteId] ?? '?'
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  static async obtenerEnvios(filtros: any, limit: number, skip: number) {
    // Implementar filtros y paginación
    const query: any = {};

    const personasQuery: any = {};
    if (filtros.genero) personasQuery.genero = filtros.genero;
    if (filtros.signoZodiacalId) personasQuery.signoZodiacalId = new mongoose.Types.ObjectId(filtros.signoZodiacalId);
    
    // Si hay filtros de persona, primero encontramos esas personas
    if (Object.keys(personasQuery).length > 0) {
      const personas = await Persona.find(personasQuery, '_id');
      query.personaId = { $in: personas.map(p => p._id) };
    }

    if (filtros.fechaInicio || filtros.fechaFin) {
      query.fechaEnvio = {};
      if (filtros.fechaInicio) query.fechaEnvio.$gte = new Date(filtros.fechaInicio);
      if (filtros.fechaFin) query.fechaEnvio.$lte = new Date(filtros.fechaFin);
    }

    if (filtros.elementoPredominanteId) {
      // Filtrar envios que tienen este elemento como predominante
      const puntajes = await PuntajeElemento.find({
        elementoId: new mongoose.Types.ObjectId(filtros.elementoPredominanteId),
        esPredominante: true
      }, 'envioId');
      
      const enviosConElemento = puntajes.map(p => p.envioId);
      if (query.personaId) {
        // Intersección
        query._id = { $in: enviosConElemento };
      } else {
        query._id = { $in: enviosConElemento };
      }
    }

    const total = await Envio.countDocuments(query);
    const envios = await Envio.find(query)
      .sort({ fechaEnvio: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: 'personaId', populate: { path: 'signoZodiacalId', select: 'nombre' } });

    // Recuperar el predominante para cada uno (para mostrar en tabla)
    const enviosIds = envios.map(e => e._id);
    const predominantes = await PuntajeElemento.find({
      envioId: { $in: enviosIds },
      esPredominante: true
    }).populate('elementoId');

    const enviosResult = envios.map(env => {
      const pred = predominantes.find(p => p.envioId.toString() === env._id.toString());
      return {
        ...env.toObject(),
        predominante: pred ? pred.elementoId : null
      };
    });

    return { total, envios: enviosResult };
  }

  static async obtenerDetalleEnvio(id: string) {
    const envio = await Envio.findById(id)
      .populate({ path: 'personaId', populate: { path: 'signoZodiacalId', select: 'nombre' } });
    if (!envio) throw new Error('Envío no encontrado');

    const respuestas = await Respuesta.find({ envioId: id })
      .populate('preguntaId')
      .populate('aspectoId')
      .populate('opcionSeleccionadaId');

    const puntajes = await PuntajeElemento.find({ envioId: id })
      .populate('elementoId');

    return {
      envio,
      respuestas,
      puntajes
    };
  }
}
