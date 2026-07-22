import Persona, { IPersona } from "../models/Persona";


export class PersonaService{
    static async getPersonasByIDs(id: string[]) :Promise<IPersona[]>{
        return await Persona.find({ _id: { $in: id } });
    }   
    
}