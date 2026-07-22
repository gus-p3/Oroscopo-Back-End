import SignoZodiacal from "../models/SignoZodiacal";
import { PersonaService } from "./persona.service";
import PuntajeElemento from "../models/PuntajeElemento";
import Elemento from "../models/Elemento";

export interface ResumenPersonaModel {
    id: string;
    nombre: string;
    genero: string;
    signoZodiacal: string;
    cluster: number;
    elementoPredominanteId: string;
}

export class PersonaModelService {
    static async getPersonasForML(ids: string[], labels: number[]): Promise<ResumenPersonaModel[]> {
        try {
            const personas = await PersonaService.getPersonasByIDs(ids);

            // 1. Cargar catálogo de signos zodiacales
            const signos = await SignoZodiacal.find().lean();
            const signoMap = new Map<string, string>();
            for (const s of signos) {
                signoMap.set(s._id.toString(), s.nombre);
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
                return {
                    id: per._id.toString(),
                    nombre: per.nombre,
                    genero: per.genero,
                    signoZodiacal: signoMap.get(per.signoZodiacalId.toString()) ?? "Desconocido",
                    cluster: labels[index] ?? -1,
                    elementoPredominanteId: elementoPredominanteMap.get(per._id.toString()) ?? "Sin elemento"
                };
            });

            return resumen;
        } catch (error: any) {
            console.error("Error en PersonaModelService.getPersonasForML:", error);
            throw new Error(`Error procesando resumen de personas para ML: ${error.message || error}`);
        }
    }
}