import mongoose, { Schema, Document } from 'mongoose';

export interface IPuntajeElemento extends Document {
  envioId: mongoose.Types.ObjectId;
  personaId: mongoose.Types.ObjectId;
  elementoId: mongoose.Types.ObjectId;
  puntajeTotal: number;
  esPredominante: boolean;
}

const PuntajeElementoSchema: Schema = new Schema({
  envioId: { type: Schema.Types.ObjectId, ref: 'Envio', required: true, index: true },
  personaId: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  elementoId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true },
  puntajeTotal: { type: Number, required: true },
  esPredominante: { type: Boolean, required: true, default: false }
}, {
  timestamps: true,
  collection: 'puntajesElemento'
});

export default mongoose.model<IPuntajeElemento>('PuntajeElemento', PuntajeElementoSchema);
