import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Elemento from '../models/Elemento';
import SignoZodiacal from '../models/SignoZodiacal';
import AspectoPersonalidad from '../models/AspectoPersonalidad';
import Pregunta from '../models/Pregunta';
import OpcionRespuesta from '../models/OpcionRespuesta';
import Persona from '../models/Persona';
import Envio, { IEnvio } from '../models/Envio';
import Respuesta from '../models/Respuesta';
import PuntajeElemento from '../models/PuntajeElemento';

dotenv.config();

// ─── Tipos del cache ──────────────────────────────────────────────────────────

export interface IRespuestaInput {
    preguntaId: string;
    opcionId: string;
}

interface IOpcionCached {
    _id: string;
    elementoPrincipalId: string;
    elementoSecundarioId: string;
    valor: number;
    texto: string;
}

interface IPreguntaCached {
    _id: string;
    aspectoId: string;
    opciones: IOpcionCached[];
}

// ─── Cache de datos estáticos (cargados una sola vez) ─────────────────────────

let preguntasCache: IPreguntaCached[] = [];
let preguntasMap:   Map<string, IPreguntaCached> = new Map(); // O(1) lookup por id
let opcionesMap:    Map<string, IOpcionCached>   = new Map(); // O(1) lookup por id
let elementosMap:   Map<string, string>          = new Map(); // elementoId -> nombre
let aspectosMap:    Map<string, string>          = new Map(); // aspectoId  -> nombre

// ─── Nombres ──────────────────────────────────────────────────────────────────

const namesH = [
    'Juan', 'Pedro', 'Luis', 'Carlos', 'Miguel', 'José', 'Andrés', 'Diego', 'Fernando', 'Ricardo',
    'Javier', 'Sergio', 'David', 'Francisco', 'Alejandro', 'Manuel', 'Rafael', 'Roberto', 'Antonio', 'Eduardo',
    'Jorge', 'Raúl', 'Héctor', 'Gonzalo', 'Alberto', 'Ignacio', 'Pablo', 'Víctor', 'Emilio', 'Adrián'
];
const namesM = [
    'María', 'Ana', 'Laura', 'Carmen', 'Lucía', 'Sofía', 'Isabel', 'Patricia', 'Elena', 'Marta',
    'Beatriz', 'Diana', 'Gabriela', 'Julia', 'Claudia', 'Verónica', 'Lorena', 'Silvia', 'Rosa', 'Teresa',
    'Natalia', 'Carolina', 'Paula', 'Raquel', 'Cristina', 'Marina', 'Daniela', 'Adriana', 'Alicia', 'Esther'
];

// ─── Conexión ─────────────────────────────────────────────────────────────────

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sodiacal_db';
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Conectado para Seeding...');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
};

// ─── Carga del cache ──────────────────────────────────────────────────────────
// Una sola consulta a la BD al inicio; el resto del script trabaja en memoria.

const loadStaticData = async () => {
    // Preguntas + opciones embebidas (1 query con aggregate)
    const rawPreguntas = await Pregunta.aggregate([
        { $sort: { numero: 1 } },
        {
            $lookup: {
                from: 'opcionesRespuesta',
                localField: '_id',
                foreignField: 'preguntaId',
                as: 'opciones'
            }
        },
        {
            $project: {
                numero: 1,
                texto: 1,
                aspectoId: 1,
                opciones: {
                    $sortArray: { input: '$opciones', sortBy: { numero: 1 } }
                }
            }
        }
    ]);

    preguntasCache = rawPreguntas.map(p => ({
        _id: p._id.toString(),
        aspectoId: p.aspectoId.toString(),
        opciones: p.opciones.map((o: any) => ({
            _id: o._id.toString(),
            elementoPrincipalId: o.elementoPrincipalId.toString(),
            elementoSecundarioId: o.elementoSecundarioId.toString(),
            valor: o.valor,
            texto: o.texto
        }))
    }));

    // Construir Maps para acceso O(1)
    for (const pregunta of preguntasCache) {
        preguntasMap.set(pregunta._id, pregunta);
        for (const opcion of pregunta.opciones) {
            opcionesMap.set(opcion._id, opcion);
        }
    }

    // Elementos y aspectos (2 queries simples)
    const elementos = await Elemento.find();
    for (const el of elementos) {
        elementosMap.set(el._id.toString(), el.nombre);
    }

    const aspectos = await AspectoPersonalidad.find();
    for (const asp of aspectos) {
        aspectosMap.set(asp._id.toString(), asp.nombre);
    }

    console.log(
        `📦 Cache cargado: ${preguntasCache.length} preguntas | ` +
        `${opcionesMap.size} opciones | ` +
        `${elementosMap.size} elementos | ` +
        `${aspectosMap.size} aspectos`
    );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getElementoId = async (nombre: string): Promise<mongoose.Types.ObjectId> => {
    const elemento = await Elemento.findOne({ nombre });
    if (!elemento) throw new Error(`Elemento no encontrado: ${nombre}`);
    return elemento._id;
};

const getSignosDeElemento = async (elementoId: mongoose.Types.ObjectId) => {
    const signos = await SignoZodiacal.find({ elementoId });
    if (!signos.length) throw new Error(`No hay signos para el elementoId: ${elementoId}`);
    return signos.map(s => s._id);
};

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ─── Generación de respuestas (síncrono, sin BD) ─────────────────────────────
// Reintenta hasta que el elemento predominante sea el deseado.

const generarRespuestasParaElemento = (elementoId: string): IRespuestaInput[] => {
    const MAX_INTENTOS = 100;
    let intentos = 0;
    let answerData: IRespuestaInput[] = [];

    do {
        intentos++;

        // Selección aleatoria desde el cache
        answerData = preguntasCache.map(pregunta => ({
            preguntaId: pregunta._id,
            opcionId: pick(pregunta.opciones)._id
        }));

        // Calcular puntajes en memoria
        const puntajesMap: Record<string, number> = {};
        for (const elId of elementosMap.keys()) puntajesMap[elId] = 0;

        for (const resp of answerData) {
            const opcion = opcionesMap.get(resp.opcionId)!;
            puntajesMap[opcion.elementoPrincipalId] += 3;
            puntajesMap[opcion.elementoSecundarioId] += 1;
        }

        // Elemento con mayor puntaje
        const predominanteId = Object.entries(puntajesMap)
            .reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0];

        if (predominanteId === elementoId) break;

        if (intentos >= MAX_INTENTOS) {
            throw new Error(
                `No se pudo generar el elemento "${elementosMap.get(elementoId)}" ` +
                `después de ${MAX_INTENTOS} intentos.`
            );
        }

    } while (true);

    console.log(
        `    🎲 Elemento ${elementosMap.get(elementoId)} logrado en ${intentos} intento(s).`
    );
    return answerData;
};

// ─── Persistir respuestas y puntajes (async, escribe en BD) ──────────────────

const persistirRespuestasEnvio = async (
    respuestas: IRespuestaInput[],
    envio: IEnvio
) => {
    const puntajesMap: Record<string, number> = {};
    for (const elId of elementosMap.keys()) puntajesMap[elId] = 0;

    const respuestasParaInsertar = respuestas.map(resp => {
        const opcion    = opcionesMap.get(resp.opcionId)!;
        const pregunta  = preguntasMap.get(resp.preguntaId)!;

        // Acumular puntajes
        puntajesMap[opcion.elementoPrincipalId]  += 3;
        puntajesMap[opcion.elementoSecundarioId] += 1;

        return {
            envioId:                    envio._id,
            preguntaId:                 new mongoose.Types.ObjectId(resp.preguntaId),
            aspectoId:                  new mongoose.Types.ObjectId(pregunta.aspectoId),
            opcionSeleccionadaId:       new mongoose.Types.ObjectId(resp.opcionId),
            valorAspecto:               opcion.valor,
            textoRespuestaCualitativa:  opcion.texto,
            elementoPrincipalId:        new mongoose.Types.ObjectId(opcion.elementoPrincipalId),
            puntajePrincipal:           3,
            elementoSecundarioId:       new mongoose.Types.ObjectId(opcion.elementoSecundarioId),
            puntajeSecundario:          1
        };
    });

    await Respuesta.insertMany(respuestasParaInsertar);

    // Elemento predominante
    const predominanteId = Object.entries(puntajesMap)
        .reduce((max, cur) => (cur[1] > max[1] ? cur : max))[0];

    const puntajesParaInsertar = Object.entries(puntajesMap).map(([elId, puntaje]) => ({
        envioId:        envio._id,
        personaId:      envio.personaId,
        elementoId:     new mongoose.Types.ObjectId(elId),
        puntajeTotal:   puntaje,
        esPredominante: elId === predominanteId
    }));

    await PuntajeElemento.insertMany(puntajesParaInsertar);
};

// ─── Generar personas de un elemento ─────────────────────────────────────────

const setPersonasElemento = async (elemento: string, cantidad: number) => {
    const elementoId = await getElementoId(elemento);
    const signos     = await getSignosDeElemento(elementoId);

    console.log(`\n🔥 Generando ${cantidad} personas para "${elemento}"...`);

    for (let i = 0; i < cantidad; i++) {
        const genero = Math.random() < 0.5 ? 'Masculino' : 'Femenino';
        const nombre = genero === 'Masculino' ? pick(namesH) : pick(namesM);

        const persona = new Persona({
            nombre,
            genero,
            signoZodiacalId: pick(signos)
        });
        await persona.save();

        const envio = new Envio({ personaId: persona._id, estado: 'completo' });
        await envio.save();

        // Síncrono: no toca la BD
        const respuestas = generarRespuestasParaElemento(elementoId.toString());

        // Async: escribe en BD de una vez (insertMany)
        await persistirRespuestasEnvio(respuestas, envio);

        console.log(`  [${i + 1}/${cantidad}] ${nombre} (${genero}) — ${elemento}`);
    }
};

// ─── Entrada principal ────────────────────────────────────────────────────────

const runPersonas = async (cantidad: number) => {
    await connectDB();
    await loadStaticData();   // ← Única carga masiva desde la BD

    for (const elemento of ['Fuego', 'Agua', 'Tierra', 'Aire']) {
        await setPersonasElemento(elemento, cantidad);
    }

    const total = cantidad * 4;
    console.log(`\n🎉 Seeding completo: ${total} personas generadas (${cantidad} por elemento).`);

    await mongoose.disconnect();
    process.exit(0);
};

// ─── Ejecutar ─────────────────────────────────────────────────────────────────
// Uso: npx ts-node Personas_Aleatorias.ts [cantidad]   (por defecto: 25)

const CANTIDAD_POR_ELEMENTO = parseInt(process.argv[2] ?? '25', 10);

if (isNaN(CANTIDAD_POR_ELEMENTO) || CANTIDAD_POR_ELEMENTO <= 0) {
    console.error('❌ La cantidad debe ser un número entero positivo.');
    process.exit(1);
}

runPersonas(CANTIDAD_POR_ELEMENTO);