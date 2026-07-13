import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Elemento from '../models/Elemento';
import SignoZodiacal from '../models/SignoZodiacal';
import AspectoPersonalidad from '../models/AspectoPersonalidad';
import Pregunta from '../models/Pregunta';
import OpcionRespuesta from '../models/OpcionRespuesta';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sodiacal_db';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Conectado para Seeding...');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

const runSeed = async () => {
  await connectDB();

  try {
    console.log('Limpiando colecciones de catálogo...');
    await OpcionRespuesta.deleteMany({});
    await Pregunta.deleteMany({});
    await AspectoPersonalidad.deleteMany({});
    await SignoZodiacal.deleteMany({});
    await Elemento.deleteMany({});

    console.log('Insertando Elementos...');
    const elFuego = await Elemento.create({ nombre: 'Fuego', naturaleza: 'Activo' });
    const elTierra = await Elemento.create({ nombre: 'Tierra', naturaleza: 'Pasivo' });
    const elAire = await Elemento.create({ nombre: 'Aire', naturaleza: 'Activo' });
    const elAgua = await Elemento.create({ nombre: 'Agua', naturaleza: 'Pasivo' });

    // Actualizar elementos par
    elFuego.elementoParId = elAire._id as mongoose.Types.ObjectId;
    elAire.elementoParId = elFuego._id as mongoose.Types.ObjectId;
    elTierra.elementoParId = elAgua._id as mongoose.Types.ObjectId;
    elAgua.elementoParId = elTierra._id as mongoose.Types.ObjectId;

    await elFuego.save();
    await elAire.save();
    await elTierra.save();
    await elAgua.save();

    console.log('Insertando Signos Zodiacales...');
    const signos = [
      { nombre: 'Aries', elementoId: elFuego._id },
      { nombre: 'Leo', elementoId: elFuego._id },
      { nombre: 'Sagitario', elementoId: elFuego._id },
      { nombre: 'Tauro', elementoId: elTierra._id },
      { nombre: 'Virgo', elementoId: elTierra._id },
      { nombre: 'Capricornio', elementoId: elTierra._id },
      { nombre: 'Géminis', elementoId: elAire._id },
      { nombre: 'Libra', elementoId: elAire._id },
      { nombre: 'Acuario', elementoId: elAire._id },
      { nombre: 'Cáncer', elementoId: elAgua._id },
      { nombre: 'Escorpio', elementoId: elAgua._id },
      { nombre: 'Piscis', elementoId: elAgua._id }
    ];
    await SignoZodiacal.insertMany(signos);

    console.log('Insertando Aspectos de Personalidad, Preguntas y Opciones...');
    const aspectosData = [
      {
        nombre: 'Impulsividad',
        elementoDuenioId: elFuego._id,
        elementoParId: elAire._id,
        pregunta: {
          numero: 1,
          texto: '¿Qué tan rápido pasas de pensar a actuar?',
          opciones: [
            { numero: 1, texto: 'Casi siempre me tomo tiempo para pensar antes de actuar.', valor: 1 },
            { numero: 2, texto: 'A veces actúo rápido, pero normalmente evalúo un poco antes.', valor: 2 },
            { numero: 3, texto: 'Con frecuencia actúo antes de terminar de pensarlo.', valor: 3 },
            { numero: 4, texto: 'Actúo de inmediato; pensarlo después me parece perder tiempo.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Tolerancia al riesgo',
        elementoDuenioId: elFuego._id,
        elementoParId: elAire._id,
        pregunta: {
          numero: 2,
          texto: '¿Cómo te relacionas con el riesgo y la incertidumbre?',
          opciones: [
            { numero: 1, texto: 'Evito los riesgos; prefiero lo seguro y comprobado.', valor: 1 },
            { numero: 2, texto: 'Tomo riesgos pequeños si el beneficio es claro.', valor: 2 },
            { numero: 3, texto: 'Disfruto arriesgarme aunque el resultado no esté garantizado.', valor: 3 },
            { numero: 4, texto: 'Busco activamente retos arriesgados; la incertidumbre me emociona.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Necesidad de estimulación',
        elementoDuenioId: elFuego._id,
        elementoParId: elAire._id,
        pregunta: {
          numero: 3,
          texto: '¿Qué tan bien toleras la rutina?',
          opciones: [
            { numero: 1, texto: 'Me siento cómodo(a) con la rutina; no necesito cambios constantes.', valor: 1 },
            { numero: 2, texto: 'De vez en cuando busco algo distinto para no aburrirme.', valor: 2 },
            { numero: 3, texto: 'Necesito variedad; la rutina prolongada me cansa rápido.', valor: 3 },
            { numero: 4, texto: 'Busco constantemente experiencias o ideas nuevas; la rutina me asfixia.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Necesidad de estructura',
        elementoDuenioId: elTierra._id,
        elementoParId: elAgua._id,
        pregunta: {
          numero: 4,
          texto: '¿Qué tan necesario es para ti tener un plan o rutina fija?',
          opciones: [
            { numero: 1, texto: 'Puedo funcionar bien sin horarios ni planes fijos.', valor: 1 },
            { numero: 2, texto: 'Prefiero tener un plan general, aunque sea flexible.', valor: 2 },
            { numero: 3, texto: 'Me siento más tranquilo(a) con horarios y rutinas claras.', valor: 3 },
            { numero: 4, texto: 'Necesito un plan detallado; la improvisación me genera estrés.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Necesidad de control',
        elementoDuenioId: elTierra._id,
        elementoParId: elAgua._id,
        pregunta: {
          numero: 5,
          texto: '¿Qué tan cómodo(a) te sientes dependiendo de otros o de circunstancias externas?',
          opciones: [
            { numero: 1, texto: 'No me incomoda depender de otros o de lo que no puedo controlar.', valor: 1 },
            { numero: 2, texto: 'Prefiero tener cierto control, pero puedo ceder cuando hace falta.', valor: 2 },
            { numero: 3, texto: 'Me cuesta delegar o depender de circunstancias externas.', valor: 3 },
            { numero: 4, texto: 'Necesito tener el control de la situación; depender de otros me genera ansiedad.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Ambición',
        elementoDuenioId: elTierra._id,
        elementoParId: elAgua._id,
        pregunta: {
          numero: 6,
          texto: '¿Qué tanto te motiva alcanzar grandes metas y ser reconocido(a)?',
          opciones: [
            { numero: 1, texto: 'No me mueve mucho alcanzar grandes metas o el reconocimiento.', valor: 1 },
            { numero: 2, texto: 'Tengo metas, pero no es lo que más me motiva en el día a día.', valor: 2 },
            { numero: 3, texto: 'Me esfuerzo bastante por lograr metas importantes.', valor: 3 },
            { numero: 4, texto: 'Me motiva profundamente alcanzar metas grandes y ser reconocido(a) por ello.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Sociabilidad',
        elementoDuenioId: elAire._id,
        elementoParId: elFuego._id,
        pregunta: {
          numero: 7,
          texto: '¿Qué tanto te energiza estar rodeado(a) de gente?',
          opciones: [
            { numero: 1, texto: 'Prefiero espacios tranquilos con poca gente.', valor: 1 },
            { numero: 2, texto: 'Disfruto socializar, aunque también necesito tiempo a solas.', valor: 2 },
            { numero: 3, texto: 'Me energiza estar rodeado(a) de gente la mayor parte del tiempo.', valor: 3 },
            { numero: 4, texto: 'Me energizo estando rodeado(a) de gente y conociendo personas nuevas constantemente.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Orientación a la lógica',
        elementoDuenioId: elAire._id,
        elementoParId: elFuego._id,
        pregunta: {
          numero: 8,
          texto: 'Al tomar decisiones, ¿te guías más por datos o por sentimientos?',
          opciones: [
            { numero: 1, texto: 'Decido principalmente con lo que siento, más que con datos.', valor: 1 },
            { numero: 2, texto: 'Considero tanto datos como sentimientos al decidir.', valor: 2 },
            { numero: 3, texto: 'Prefiero apoyarme en datos y razones antes que en emociones.', valor: 3 },
            { numero: 4, texto: 'Decido casi siempre con datos y lógica; dejo las emociones fuera.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Apertura al cambio',
        elementoDuenioId: elAire._id,
        elementoParId: elFuego._id,
        pregunta: {
          numero: 9,
          texto: '¿Cómo reaccionas cuando los planes cambian de repente?',
          opciones: [
            { numero: 1, texto: 'Los cambios repentinos de planes me cuestan bastante.', valor: 1 },
            { numero: 2, texto: 'Me adapto a los cambios, aunque necesito un momento para ajustarme.', valor: 2 },
            { numero: 3, texto: 'Me adapto con facilidad cuando los planes cambian de repente.', valor: 3 },
            { numero: 4, texto: 'Disfruto cuando los planes cambian; me aburre que todo siga igual.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Empatía',
        elementoDuenioId: elAgua._id,
        elementoParId: elTierra._id,
        pregunta: {
          numero: 10,
          texto: '¿Qué tan fácil te resulta percibir lo que sienten los demás?',
          opciones: [
            { numero: 1, texto: 'Me cuesta notar lo que sienten los demás si no me lo dicen.', valor: 1 },
            { numero: 2, texto: 'A veces percibo lo que otros sienten, pero no siempre.', valor: 2 },
            { numero: 3, texto: 'Percibo con facilidad lo que otras personas están sintiendo.', valor: 3 },
            { numero: 4, texto: 'Siento casi de inmediato el estado emocional de quienes me rodean.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Intuición',
        elementoDuenioId: elAgua._id,
        elementoParId: elTierra._id,
        pregunta: {
          numero: 11,
          texto: '¿Qué tanto confías en tu intuición frente a los datos objetivos?',
          opciones: [
            { numero: 1, texto: 'Confío más en datos y hechos que en corazonadas.', valor: 1 },
            { numero: 2, texto: 'A veces sigo mi intuición, pero prefiero confirmarla con lógica.', valor: 2 },
            { numero: 3, texto: 'Sigo mi instinto aunque no siempre pueda explicarlo del todo.', valor: 3 },
            { numero: 4, texto: 'Confío plenamente en mi intuición, incluso sin poder justificarla.', valor: 4 }
          ]
        }
      },
      {
        nombre: 'Necesidad de conexión emocional profunda',
        elementoDuenioId: elAgua._id,
        elementoParId: elTierra._id,
        pregunta: {
          numero: 12,
          texto: '¿Prefieres muchas relaciones ligeras o pocas relaciones profundas?',
          opciones: [
            { numero: 1, texto: 'Prefiero muchas relaciones ligeras antes que pocas muy cercanas.', valor: 1 },
            { numero: 2, texto: 'Me gusta un equilibrio entre relaciones cercanas y conocidos.', valor: 2 },
            { numero: 3, texto: 'Prefiero pocas relaciones, pero profundas y significativas.', valor: 3 },
            { numero: 4, texto: 'Necesito conexiones emocionales profundas; las relaciones superficiales me dejan vacío(a).', valor: 4 }
          ]
        }
      }
    ];

    for (const data of aspectosData) {
      const aspecto = await AspectoPersonalidad.create({
        nombre: data.nombre,
        elementoDuenioId: data.elementoDuenioId,
        elementoParId: data.elementoParId
      });

      const pregunta = await Pregunta.create({
        numero: data.pregunta.numero,
        texto: data.pregunta.texto,
        aspectoId: aspecto._id
      });

      const getElementosPrincipalYSecundario = (preguntaNum: number, opcionNum: number) => {
        if (preguntaNum >= 1 && preguntaNum <= 3) {
          if (opcionNum === 1) return [elTierra._id, elAgua._id];
          if (opcionNum === 2) return [elAgua._id, elTierra._id];
          if (opcionNum === 3) return [elAire._id, elFuego._id];
          if (opcionNum === 4) return [elFuego._id, elAire._id];
        }
        if (preguntaNum >= 4 && preguntaNum <= 6) {
          if (opcionNum === 1) return [elFuego._id, elAire._id];
          if (opcionNum === 2) return [elAire._id, elFuego._id];
          if (opcionNum === 3) return [elAgua._id, elTierra._id];
          if (opcionNum === 4) return [elTierra._id, elAgua._id];
        }
        if (preguntaNum >= 7 && preguntaNum <= 9) {
          if (opcionNum === 1) return [elAgua._id, elTierra._id];
          if (opcionNum === 2) return [elTierra._id, elAgua._id];
          if (opcionNum === 3) return [elFuego._id, elAire._id];
          if (opcionNum === 4) return [elAire._id, elFuego._id];
        }
        if (preguntaNum >= 10 && preguntaNum <= 12) {
          if (opcionNum === 1) return [elAire._id, elFuego._id];
          if (opcionNum === 2) return [elFuego._id, elAire._id];
          if (opcionNum === 3) return [elTierra._id, elAgua._id];
          if (opcionNum === 4) return [elAgua._id, elTierra._id];
        }
        return [null, null];
      };

      const opcionesToInsert = data.pregunta.opciones.map(opt => {
        const [principalId, secundarioId] = getElementosPrincipalYSecundario(data.pregunta.numero, opt.numero);
        return {
          preguntaId: pregunta._id,
          numero: opt.numero,
          texto: opt.texto,
          valor: opt.valor,
          elementoPrincipalId: principalId,
          elementoSecundarioId: secundarioId
        };
      });

      await OpcionRespuesta.insertMany(opcionesToInsert);
    }

    console.log('¡Seeding completado exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('Error durante el seeding:', error);
    process.exit(1);
  }
};

runSeed();
