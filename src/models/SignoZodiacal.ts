import mongoose, { Schema, Document } from 'mongoose';

export interface ISignoZodiacal extends Document {
  nombre: string;
  elementoId: mongoose.Types.ObjectId;
}

const SignoZodiacalSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  elementoId: { type: Schema.Types.ObjectId, ref: 'Elemento', required: true }
}, {
  timestamps: true,
  collection: 'signosZodiacales'
});

export default mongoose.model<ISignoZodiacal>('SignoZodiacal', SignoZodiacalSchema);
