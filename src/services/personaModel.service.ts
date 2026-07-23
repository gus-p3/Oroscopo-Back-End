import Persona, { IPersona } from "../models/Persona";
import SignoZodiacal from "../models/SignoZodiacal";
import { PersonaService } from "./persona.service";
import PuntajeElemento from "../models/PuntajeElemento";
import Elemento from "../models/Elemento";
import Envio from "../models/Envio";
import Respuesta from "../models/Respuesta";

export interface ResumenPersonaModel {
    id: string;
    nombre: string;
    genero: string;
    signoZodiacal: string;
    elementoSigno: string;
    elementoEncuesta: string;
    cluster: number;
    elementoPredominanteId: string;
    puntajes?: { [key: string]: number };
}

export class PersonaModelService {
    /**
     * Construye la lista de resúmenes de personas para ser consumidos por los algoritmos de Machine Learning (K-Means y Jerárquico).
     */
    static async getPersonasForML(ids: string[], labels: number[]): Promise<ResumenPersonaModel[]> {
        try {
            const personas = await PersonaService.getPersonasByIDs(ids);

            // 1. Cargar catálogo de signos zodiacales
            const signos = await SignoZodiacal.find().lean();
            const signoMap = new Map<string, { nombre: string; elementoId: string }>();
            for (const s of signos) {
                signoMap.set(s._id.toString(), {
                    nombre: s.nombre,
                    elementoId: s.elementoId ? s.elementoId.toString() : ""
                });
            }

            // 2. Cargar catálogo de elementos
            const elementos = await Elemento.find().lean();
            const elementoMap = new Map<string, string>();
            for (const e of elementos) {
                elementoMap.set(e._id.toString(), e.nombre);
            }

            // 3. Cargar puntajes de elementos predominantes en 1 sola consulta batch
            const personaIds = personas.map(p => p._id);
            const puntajes = await PuntajeElemento.find({
                personaId: { $in: personaIds },
                esPredominante: true
            }).lean();

            const elementoPredominanteMap = new Map<string, string>();
            for (const p of puntajes) {
                const nombreElemento = elementoMap.get(p.elementoId.toString()) ?? "";
                elementoPredominanteMap.set(p.personaId.toString(), nombreElemento);
            }

            // 4. Mapear y construir el resumen final
            const resumen: ResumenPersonaModel[] = personas.map((per, index) => {
                const signoInfo = signoMap.get(per.signoZodiacalId.toString());
                const elementoSignoNombre = signoInfo ? (elementoMap.get(signoInfo.elementoId) ?? "Desconocido") : "Desconocido";
                const elementoEncuestaNombre = elementoPredominanteMap.get(per._id.toString()) ?? "Sin evaluar";

                return {
                    id: per._id.toString(),
                    nombre: per.nombre,
                    genero: per.genero,
                    signoZodiacal: signoInfo ? signoInfo.nombre : "Desconocido",
                    elementoSigno: elementoSignoNombre,
                    elementoEncuesta: elementoEncuestaNombre,
                    cluster: labels[index] ?? -1,
                    elementoPredominanteId: elementoEncuestaNombre
                };
            });

            return resumen;
        } catch (error: any) {
            console.error("Error en PersonaModelService.getPersonasForML:", error);
            throw new Error(`Error procesando resumen de personas para ML: ${error.message || error}`);
        }
    }

    /**
     * Obtiene el resumen de la personalidad y respuestas de una persona por su ID.
     */
    static async getPersonaPersonalidadID(id: string) {
        try {
            const envio = await Envio.findOne({ personaId: id }).populate({
                path: "personaId",
                select: "nombre genero signoZodiacalId",
                populate: {
                    path: "signoZodiacalId",
                    select: "nombre elementoId",
                    populate: {
                        path: "elementoId",
                        select: "nombre"
                    }
                }
            });

            if (!envio) {
                return null;
            }

            const respuestas = await Respuesta.find({ envioId: envio._id }).populate({
                path: "aspectoId",
                select: "_id nombre"
            });

            let aspectos = new Map<string, number>();
            for (const res of respuestas) {
                const aspecto = res.aspectoId as any;
                if (aspecto && aspecto.nombre) {
                    aspectos.set(aspecto.nombre, res.valorAspecto);
                }
            }

            const puntajesElemento = await PuntajeElemento.find({
                personaId: id,
                envioId: envio._id
            }).populate({
                path: "elementoId",
                select: "_id nombre"
            });

            let matPuntuajesElm = new Map<string, number>();
            for (const punt of puntajesElemento) {
                const elObj = punt.elementoId as any;
                if (elObj && elObj.nombre) {
                    matPuntuajesElm.set(elObj.nombre, punt.puntajeTotal);
                }
            }

            const persona = envio.personaId as any;
            const signo = persona?.signoZodiacalId as any;
            const elemento = signo?.elementoId as any;

            return {
                id: persona?._id?.toString() || id,
                nombre: persona?.nombre || '',
                genero: persona?.genero || '',
                signoZodiacal: signo?.nombre || 'Desconocido',
                elementoSigno: elemento?.nombre || 'Desconocido',
                aspectos: Array.from(aspectos.entries()),
                puntajesElementos: Array.from(matPuntuajesElm.entries()),
                elementoId: elemento?._id?.toString() || '',
                elementoNombre: elemento?.nombre || ''
            };
        } catch (error: any) {
            console.error('Error en getPersonaPersonalidadID:', error);
            throw new Error(`Error al obtener la información de la persona: ${error.message || error}`);
        }
    }
}