import Pregunta, { IPregunta } from "../models/Pregunta";


export class PreguntaService{
    static async getPreguntasByIDs(ids: string[]) :Promise<IPregunta[]>{
        return await Pregunta.find({ _id: { $in: ids } });
    }   
    
}