import mongoose, { Schema, Document } from 'mongoose';

export interface IPregunta extends Document {
  numero: number;
  texto: string;
  aspectoId: mongoose.Types.ObjectId;
}

const PreguntaSchema: Schema = new Schema({
  numero: { type: Number, required: true },
  texto: { type: String, required: true },
  aspectoId: { type: Schema.Types.ObjectId, ref: 'AspectoPersonalidad', required: true }
}, {
  timestamps: true,
  collection: 'preguntas'
});

export default mongoose.model<IPregunta>('Pregunta', PreguntaSchema);
