import mongoose, { Schema, Document } from 'mongoose';

export interface IPersona extends Document {
  nombre: string;
  genero: 'Femenino' | 'Masculino' | 'Otro' | 'Prefiero no decir';
  signoZodiacalId: mongoose.Types.ObjectId;
  fechaRegistro: Date;
}

const PersonaSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  genero: { 
    type: String, 
    enum: ['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'], 
    required: true 
  },
  signoZodiacalId: { type: Schema.Types.ObjectId, ref: 'SignoZodiacal', required: true },
  fechaRegistro: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'personas'
});

export default mongoose.model<IPersona>('Persona', PersonaSchema);
