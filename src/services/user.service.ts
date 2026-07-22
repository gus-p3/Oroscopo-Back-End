import { UserModel } from '../models/user.model';

export class UserService {
    static async getAllUsers() {
        // Aquí interactúas con el modelo
        return await UserModel.find();
    }

    static async createUser(data: any) {
        return await UserModel.create(data);
    }


}