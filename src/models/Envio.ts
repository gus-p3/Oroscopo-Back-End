import mongoose, { Schema, Document } from 'mongoose';

export interface IEnvio extends Document {
  personaId: mongoose.Types.ObjectId;
  fechaEnvio: Date;
  estado: 'completo' | 'incompleto';
}

const EnvioSchema: Schema = new Schema({
  personaId: { type: Schema.Types.ObjectId, ref: 'Persona', required: true, index: true },
  fechaEnvio: { type: Date, default: Date.now },
  estado: { type: String, enum: ['completo', 'incompleto'], required: true }
}, {
  timestamps: true,
  collection: 'envios'
});

export default mongoose.model<IEnvio>('Envio', EnvioSchema);
