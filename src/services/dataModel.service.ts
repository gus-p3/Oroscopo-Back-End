import Envio from "../models/Envio";
import Respuesta from "../models/Respuesta";
import { HierarchicalRequest, MetodoEnlace } from "../models/schema/Hierarchical.model";
import { DatasetRow, KMeansRequest } from "../models/schema/KMeans.model";
import { PersonaService } from "./persona.service";
import { PreguntaService } from "./pregunta.service";

export interface SendData {
    ids: string[],
    questions: string[],
}

export interface SendDataModelKMeans extends SendData {
    k: number,
    incluirPCA: boolean
}

export interface SendDataModelHierarchical extends SendData {
    metodoEnlace: MetodoEnlace
}

export interface DataPersons {
    dataset: DatasetRow[],
    ids: string[],
}

export class DataModelService {
    static async getSendsKMeans(data: SendDataModelKMeans): Promise<KMeansRequest> {
        try {
            const dataPersons = await this.setData(data);

            return {
                dataset: dataPersons.dataset,
                ids: dataPersons.ids,
                k: data.k,
                incluirPCA: data.incluirPCA
            };
        } catch (error) {
            throw error;
        }
    }

    static async getSendsHierarchical(data: SendDataModelHierarchical): Promise<HierarchicalRequest> {
        try {
            const dataPersons = await this.setData(data);

            return {
                dataset: dataPersons.dataset,
                ids: dataPersons.ids,
                metodoEnlace: data.metodoEnlace
            };
        } catch (error) {
            throw error;
        }
    }

    static async setData(data: SendData): Promise<DataPersons> {
        const personas = await PersonaService.getPersonasByIDs(data.ids);
        const preguntas = await PreguntaService.getPreguntasByIDs(data.questions);

        const personaIds = personas.map(p => p._id);
        const preguntaIds = preguntas.map(p => p._id);

        // 1. Consulta batch para traer los envíos de todas las personas de una sola vez
        const envios = await Envio.find(
            { personaId: { $in: personaIds } },
            { _id: 1, personaId: 1 }
        ).lean();

        const personaToEnvioMap = new Map<string, string>();
        const envioIds: any[] = [];

        for (const env of envios) {
            const personaIdStr = env.personaId.toString();
            const envioIdStr = env._id.toString();
            personaToEnvioMap.set(personaIdStr, envioIdStr);
            envioIds.push(env._id);
        }

        // 2. Consulta batch para traer todas las respuestas usando el nuevo índice compuesto
        const respuestas = await Respuesta.find(
            {
                envioId: { $in: envioIds },
                preguntaId: { $in: preguntaIds }
            },
            { envioId: 1, preguntaId: 1, valorAspecto: 1 }
        ).lean();

        // Crear mapa para búsquedas O(1) instantáneas en memoria
        const respuestasMap = new Map<string, number>();
        for (const resp of respuestas) {
            const key = `${resp.envioId.toString()}_${resp.preguntaId.toString()}`;
            respuestasMap.set(key, resp.valorAspecto);
        }

        let dataset: DatasetRow[] = [];
        let ids: string[] = [];

        // 3. Ensamblar el dataset en memoria (ultra rápido)
        for (const per of personas) {
            const personaIdStr = per._id.toString();
            const envioIdStr = personaToEnvioMap.get(personaIdStr);
            if (!envioIdStr) continue;

            let fila: DatasetRow = {};

            for (const pre of preguntas) {
                const key = `${envioIdStr}_${pre._id.toString()}`;
                const valor = respuestasMap.get(key);
                if (valor !== undefined) {
                    fila[pre._id.toString()] = valor;
                }
            }

            ids.push(personaIdStr);
            dataset.push(fila);
        }

        return { dataset, ids };
    }
}
