import mongoose from 'mongoose';
import process from 'process';

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mi_base_de_datos';
        await mongoose.connect(uri);
        console.log('📦 Base de datos conectada con éxito');
    } catch (error) {
        console.error('❌ Error al conectar la base de datos:', error);
        process.exit(1);
    }
};