import mongoose, { Schema, Document } from 'mongoose';

export interface IElemento extends Document {
  nombre: string;
  naturaleza: string;
  elementoParId: mongoose.Types.ObjectId;
  descripcion: string;
  fortalezas: string[];
  retos: string[];
}

const ElementoSchema: Schema = new Schema({
  nombre: { type: String, required: true },
  naturaleza: { type: String, required: true },
  elementoParId: { type: Schema.Types.ObjectId, ref: 'Elemento' },
  descripcion: { type: String },
  fortalezas: [{ type: String }],
  retos: [{ type: String }]
}, {
  timestamps: true,
  collection: 'elementos'
});

export default mongoose.model<IElemento>('Elemento', ElementoSchema);
