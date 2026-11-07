// Runs before each test file: start a throwaway MongoDB and set the env the
// app reads at import time (db/index.js and the auth middleware).
import { afterAll, afterEach } from "vitest";
import { createRequire } from "node:module";
import { MongoMemoryServer } from "mongodb-memory-server";

const require = createRequire(import.meta.url);

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("el-gorrilla-test");
process.env.TOKEN_SECRET = "test-secret";

const mongoose = require("mongoose");

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const name of Object.keys(collections)) {
    await collections[name].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
