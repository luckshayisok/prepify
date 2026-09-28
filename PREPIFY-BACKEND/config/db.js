import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB(uri = env.mongoUri, dbName = env.mongoDb) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, dbName ? { dbName } : {});
  console.log(`MongoDB connected (${mongoose.connection.name})`);
  return mongoose.connection;
}
