import mongoose, { Schema, Document } from 'mongoose';

export interface IRespuesta extends Document {
  envioId: mongoose.Types.ObjectId;
  preguntaId: mongoose.Types.ObjectId;
  aspectoId: mongoose.Types.ObjectId;
  opcionSeleccionadaId: mongoose.Types.ObjectId;
  valorAspecto: number;
  textoRespuestaCualitativa: string;
}

const RespuestaSchema: Schema = new Schema({
  envioId: { type: Schema.Types.ObjectId, ref: 'Envio', required: true, index: true },
  preguntaId: { type: Schema.Types.ObjectId, ref: 'Pregunta', required: true },
  aspectoId: { type: Schema.Types.ObjectId, ref: 'AspectoPersonalidad', required: true },
  opcionSeleccionadaId: { type: Schema.Types.ObjectId, ref: 'OpcionRespuesta', required: true },
  valorAspecto: { type: Number, required: true },
  textoRespuestaCualitativa: { type: String, required: true }
}, {
  timestamps: true,
  collection: 'respuestas'
});

export default mongoose.model<IRespuesta>('Respuesta', RespuestaSchema);
