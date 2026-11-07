// Shared helpers. The app is CommonJS, so it is loaded with Node's require to
// share one mongoose instance with the models used here.
import { createRequire } from "node:module";
import request from "supertest";

const require = createRequire(import.meta.url);

export const app = require("../app");
export const mongoose = require("mongoose");
export const bcrypt = require("bcryptjs");
export const User = require("../models/User.model");
export const Calles = require("../models/Calles.model");
export const Cars = require("../models/Cars.models");

export const api = () => request(app);

export const VALID_PASSWORD = "Password1";

/** Waits until the app's own mongoose connection is open. */
export const connected = () => mongoose.connection.asPromise();

/**
 * Creates a user directly (signup cannot create admins) and logs in through
 * the public endpoint. Returns the user document and a Bearer header value.
 */
export async function loginAs({ username = "user1", role = "user" } = {}) {
  const password = await bcrypt.hash(VALID_PASSWORD, 4);
  const user = await User.create({
    username,
    email: `${username}@test.com`,
    password,
    role,
  });
  const res = await api()
    .post("/api/auth/login")
    .send({ username, password: VALID_PASSWORD });
  return { user, auth: `Bearer ${res.body.authToken}` };
}
