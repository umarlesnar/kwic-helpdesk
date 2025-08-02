//lib/schemas/counter.schema.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICounter extends Document {
  _id: string;
  sequence_value: number;
}

const CounterSchema: Schema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

export default Counter;