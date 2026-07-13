import mongoose, { Schema, Document } from 'mongoose';

export interface IOpcionRespuesta extends Document {
  preguntaId: mongoose.Types.ObjectId;
  numero: number;
  texto: string;
  valor: number;
  elementoPrincipalId: mongoose.Types.ObjectId;
  elementoSecundarioId: mongoose.Types.ObjectId;
}

const OpcionRespuestaSchema: Schema = new Schema({
  preguntaId: { type: Schema.Types.ObjectId, ref: 'Pregunta', required: true, index: true },
  numero: { type: Number, required: true },
  texto: { type: String, required: true },
  valor: { type: Number, required: true },
  elementoPrincipalId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true },
  elementoSecundarioId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true }
}, {
  timestamps: true,
  collection: 'opcionesRespuesta'
});

export default mongoose.model<IOpcionRespuesta>('OpcionRespuesta', OpcionRespuestaSchema);
