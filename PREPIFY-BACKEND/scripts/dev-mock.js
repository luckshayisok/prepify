// Runs the API against a throwaway in-memory MongoDB with mocked AI responses.
// No .env, database or Gemini key needed: `npm run dev:mock`.
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.AI_MOCK = "true";
process.env.JWT_SECRET ||= "dev-secret";
process.env.JWT_REFRESH_SECRET ||= "dev-refresh-secret";

const mongo = await MongoMemoryServer.create();
const { connectDB } = await import("../config/db.js");
const { createApp } = await import("../app.js");
const { env } = await import("../config/env.js");

await connectDB(mongo.getUri(), "prepify-dev");
createApp().listen(env.port, () => {
  console.log(`Mock API running at http://localhost:${env.port} (in-memory DB, AI_MOCK=true)`);
});

const shutdown = async () => {
  await mongo.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
