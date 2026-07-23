import { Request, Response } from 'express';
import { PersonaModelService } from '../services/personaModel.service';

export const getPersonaPersonalidadID = async (req: Request, res: Response) => {
    try {
        const idPersona = req.params.id as string;
        console.log(idPersona);
        const result = await PersonaModelService.getPersonaPersonalidadID(idPersona);
        res.status(200).json({
            status: 200,
            message: "Éxito",
            result
        });
    } catch (e: any) {
        res.status(500).json({
            status: 500,
            message: "Error al obtener la persona",
            error: e?.message || e
        });
    }
};