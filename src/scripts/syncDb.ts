import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno desde el archivo .env principal
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// URIs de conexión
const LOCAL_URI = 'mongodb://localhost:27017/sodiacal_db';
const CLOUD_URI = 'mongodb://mongo:KmnuDfpuTmNnhSNjOvhXaSrIynpYNepR@tokaido.proxy.rlwy.net:15891/Oroscopo?authSource=admin&retryWrites=false';

async function syncDatabase() {
    console.log('=============================================');
    console.log('  Iniciando sincronización de Base de Datos  ');
    console.log('=============================================');

    let cloudConnection;
    let localConnection;

    try {
        console.log('☁️ Conectando a la base de datos de la NUBE...');
        cloudConnection = await mongoose.createConnection(CLOUD_URI).asPromise();
        console.log('✅ Conexión a la NUBE exitosa.');

        console.log('💻 Conectando a la base de datos LOCAL...');
        localConnection = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('✅ Conexión LOCAL exitosa.');

        console.log('🧹 Borrando datos previos en la base de datos LOCAL...');
        await localConnection.dropDatabase();
        console.log('✅ Base de datos local limpia.');

        // Acceder a las instancias nativas de la DB de MongoDB
        const cloudDb = cloudConnection.db;
        const localDb = localConnection.db;
        
        if (!cloudDb || !localDb) throw new Error("No se pudo acceder a las instancias de la DB nativa");

        // Listar todas las colecciones en la base de datos de la nube
        const collections = await cloudDb.listCollections().toArray();

        if (collections.length === 0) {
            console.log('⚠️ No se encontraron colecciones en la base de datos de la nube.');
        }

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`\n📦 Copiando colección: ${collectionName}...`);

            const cloudCollection = cloudDb.collection(collectionName);
            const localCollection = localDb.collection(collectionName);

            // Leer todos los documentos de la colección actual
            const documents = await cloudCollection.find({}).toArray();

            if (documents.length > 0) {
                // Insertar los documentos en la colección local
                await localCollection.insertMany(documents);
                console.log(` ✔️  ${documents.length} documentos copiados.`);
            } else {
                console.log(` ➖ La colección está vacía. Se omitió.`);
            }
        }

        console.log('\n=============================================');
        console.log(' 🎉 ¡Sincronización completada con éxito! 🎉 ');
        console.log('=============================================');
    } catch (error) {
        console.error('\n❌ Error durante la sincronización:', error);
    } finally {
        if (cloudConnection) await cloudConnection.close();
        if (localConnection) await localConnection.close();
        console.log('🔌 Conexiones cerradas.');
        process.exit(0);
    }
}

syncDatabase();
