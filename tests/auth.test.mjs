import { beforeAll, describe, expect, it } from "vitest";
import { api, connected, loginAs, User, VALID_PASSWORD } from "./helpers.mjs";

beforeAll(connected);

const signup = (body) => api().post("/api/auth/signup").send(body);
const validUser = {
  username: "maria",
  email: "maria@test.com",
  password: VALID_PASSWORD,
};

describe("GET /api", () => {
  it("answers the health check", async () => {
    const res = await api().get("/api");
    expect(res.status).toBe(200);
    expect(res.body).toBe("All good in here");
  });
});

describe("unknown routes", () => {
  it("return 404 with a message", async () => {
    const res = await api().get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "This route does not exist" });
  });
});

describe("POST /api/auth/signup", () => {
  it("creates the user with a hashed password", async () => {
    const res = await signup(validUser);

    expect(res.status).toBe(201);
    expect(res.body).toBe("Usuario registrado correctamente");
    const stored = await User.findOne({ email: "maria@test.com" });
    expect(stored.username).toBe("maria");
    expect(stored.password).not.toBe(VALID_PASSWORD);
    expect(stored.role).toBe("user");
  });

  it("ignores a role sent by the client", async () => {
    await signup({ ...validUser, role: "admin" });
    const stored = await User.findOne({ email: "maria@test.com" });
    expect(stored.role).toBe("user");
  });

  it.each(["username", "email", "password"])(
    "rejects a missing %s without storing anything",
    async (field) => {
      const res = await signup({ ...validUser, [field]: "" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ errorMessage: "Debe llenar todos los campos" });
      expect(await User.countDocuments()).toBe(0);
    }
  );

  it.each(["short1A", "nouppercase1", "NoNumberHere"])(
    "rejects the weak password %s",
    async (password) => {
      const res = await signup({ ...validUser, password });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMessage:
          "La contraseña debe de tener mínimo 8 caracteres, una mayúscula y un número",
      });
      expect(await User.countDocuments()).toBe(0);
    }
  );

  it("rejects a malformed email", async () => {
    const res = await signup({ ...validUser, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMessage: "Debe escribir el email correctamente" });
    expect(await User.countDocuments()).toBe(0);
  });

  it.each([
    ["username", { email: "other@test.com" }],
    ["email", { username: "other" }],
  ])("rejects a duplicated %s with 409", async (_field, override) => {
    await signup(validUser);
    const res = await signup({ ...validUser, ...override });
    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      errorMessage: "El nombre de usuario o el email ya están en uso.",
    });
    expect(await User.countDocuments()).toBe(1);
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    await signup(validUser);
    const res = await api()
      .post("/api/auth/login")
      .send({ username: "maria", password: VALID_PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.authToken).toBe("string");
  });

  it("requires username and password", async () => {
    const res = await api().post("/api/auth/login").send({ username: "maria" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMessage: "Debe llenar todos los campos" });
  });

  it.each([
    ["an unknown user", { username: "ghost", password: VALID_PASSWORD }],
    ["a wrong password", { username: "maria", password: "Wrong1234" }],
  ])("answers 401 with the same message for %s", async (_case, body) => {
    await signup(validUser);
    const res = await api().post("/api/auth/login").send(body);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ errorMessage: "Credenciales no validas" });
  });
});

describe("GET /api/auth/verify", () => {
  it("returns the token payload", async () => {
    const { user, auth } = await loginAs({ username: "maria" });
    const res = await api().get("/api/auth/verify").set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      _id: user._id.toString(),
      username: "maria",
      email: "maria@test.com",
      role: "user",
    });
  });

  it.each([
    ["no token", undefined],
    ["a non-Bearer token", "Basic abc"],
    ["an invalid token", "Bearer not.a.jwt"],
  ])("rejects %s with 401", async (_case, header) => {
    const req = api().get("/api/auth/verify");
    if (header) req.set("Authorization", header);
    const res = await req;
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ errorMessage: "Token no valido o no hay token" });
  });
});
