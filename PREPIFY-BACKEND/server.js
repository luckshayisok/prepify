import { assertRequiredEnv, env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

try {
  assertRequiredEnv();
  await connectDB();
} catch (err) {
  console.error("❌ Failed to start:", err.message);
  process.exit(1);
}

createApp().listen(env.port, () => {
  console.log(`🚀 Server running at http://localhost:${env.port}`);
});
