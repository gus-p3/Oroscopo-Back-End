import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
    static async getUsers(req: Request, res: Response) {
        try {
            const users = await UserService.getAllUsers();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error al obtener usuarios', error });
        }
    }

    static async createUser(req: Request, res: Response) {
        try {
            const newUser = await UserService.createUser(req.body);
            res.status(201).json(newUser);
        } catch (error) {
            res.status(500).json({ message: 'Error al crear usuario', error });
        }
    }
}