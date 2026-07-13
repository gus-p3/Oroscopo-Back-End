import mongoose, { Schema, Document } from 'mongoose';

export interface IOpcionRespuesta extends Document {
  preguntaId: mongoose.Types.ObjectId;
  numero: number;
  texto: string;
  valor: number;
}

const OpcionRespuestaSchema: Schema = new Schema({
  preguntaId: { type: Schema.Types.ObjectId, ref: 'Pregunta', required: true, index: true },
  numero: { type: Number, required: true },
  texto: { type: String, required: true },
  valor: { type: Number, required: true }
}, {
  timestamps: true,
  collection: 'opcionesRespuesta'
});

export default mongoose.model<IOpcionRespuesta>('OpcionRespuesta', OpcionRespuestaSchema);
