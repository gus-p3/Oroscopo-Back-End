import mongoose, { Schema, Document } from 'mongoose';

export interface IAspectoPersonalidad extends Document {
  nombre: string;
  elementoDuenioId: mongoose.Types.ObjectId;
  elementoParId: mongoose.Types.ObjectId;
}

const AspectoPersonalidadSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  elementoDuenioId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true },
  elementoParId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true }
}, {
  timestamps: true,
  collection: 'aspectosPersonalidad'
});

export default mongoose.model<IAspectoPersonalidad>('AspectoPersonalidad', AspectoPersonalidadSchema);
