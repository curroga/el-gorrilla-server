import { beforeAll, describe, expect, it } from "vitest";
import { api, Calles, Cars, connected, loginAs, mongoose, User } from "./helpers.mjs";

beforeAll(connected);

const newCalleBody = { name: "Gran Vía", numAparcamientos: 10, positionMarker: [40.42, -3.7] };
const createCalle = (overrides = {}) => Calles.create({ ...newCalleBody, ...overrides });
const unknownId = () => new mongoose.Types.ObjectId().toString();

describe("authentication on /api/calle", () => {
  it("rejects requests without a token", async () => {
    const res = await api().get("/api/calle");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ errorMessage: "Token no valido o no hay token" });
  });
});

describe("GET /api/calle", () => {
  it("lists every street with its cars populated", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ modelo: "Ibiza", matricula: "1234ABC", color: "rojo", owner: user._id });
    await createCalle({ coches: [car._id] });

    const res = await api().get("/api/calle").set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ name: "Gran Vía", numAparcamientos: 10, numOcupados: 0, numLibres: 0 });
    expect(res.body[0].coches[0]).toMatchObject({ modelo: "Ibiza", matricula: "1234ABC" });
  });
});

describe("POST /api/calle", () => {
  it("lets an admin create a street", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const res = await api().post("/api/calle").set("Authorization", auth).send(newCalleBody);

    expect(res.status).toBe(201);
    expect(res.body).toBe("todo bien, creada la calle en la DB");
    const stored = await Calles.findOne();
    expect(stored).toMatchObject({ name: "Gran Vía", numAparcamientos: 10 });
    expect([...stored.positionMarker]).toEqual([40.42, -3.7]);
  });

  it("rejects a regular user with 403 and stores nothing", async () => {
    const { auth } = await loginAs();
    const res = await api().post("/api/calle").set("Authorization", auth).send(newCalleBody);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorMessage: "No eres Admin" });
    expect(await Calles.countDocuments()).toBe(0);
  });
});

describe("GET /api/calle/:calleId", () => {
  it("returns the street details", async () => {
    const { auth } = await loginAs();
    const calle = await createCalle();
    const res = await api().get(`/api/calle/${calle._id}`).set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: calle._id.toString(), name: "Gran Vía" });
  });

  it("answers 404 for an unknown id", async () => {
    const { auth } = await loginAs();
    const res = await api().get(`/api/calle/${unknownId()}`).set("Authorization", auth);
    expect(res.status).toBe(404);
    expect(res.body).toBe("Calle no encontrada");
  });

  it("answers 404 for a malformed id", async () => {
    const { auth } = await loginAs();
    const res = await api().get("/api/calle/not-an-id").set("Authorization", auth);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ errorMessage: "Recurso no encontrado" });
  });
});

describe("unknown street on admin routes", () => {
  it("PATCH answers 404 and creates nothing", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const res = await api().patch(`/api/calle/${unknownId()}`).set("Authorization", auth).send({ name: "Alcalá" });
    expect(res.status).toBe(404);
    expect(res.body).toBe("Calle no encontrada");
    expect(await Calles.countDocuments()).toBe(0);
  });

  it("DELETE answers 404 and keeps the other streets", async () => {
    const { auth } = await loginAs({ role: "admin" });
    await createCalle();
    const res = await api().delete(`/api/calle/${unknownId()}`).set("Authorization", auth);
    expect(res.status).toBe(404);
    expect(res.body).toBe("Calle no encontrada");
    expect(await Calles.countDocuments()).toBe(1);
  });

  it("a non-ObjectId value in the body is not turned into a 404", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle();
    const res = await api().patch(`/api/calle/${calle._id}`).set("Authorization", auth).send({ numAparcamientos: "muchos" });
    expect(res.status).toBe(500);
    expect((await Calles.findById(calle._id)).numAparcamientos).toBe(10);
  });
});

describe("PATCH /api/calle/:calleId", () => {
  it("lets an admin update a street", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle();
    const res = await api()
      .patch(`/api/calle/${calle._id}`)
      .set("Authorization", auth)
      .send({ name: "Alcalá", numAparcamientos: 5, numOcupados: 2, numLibres: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toBe("todo bien, documento actualizado");
    expect(await Calles.findById(calle._id)).toMatchObject({
      name: "Alcalá",
      numAparcamientos: 5,
      numOcupados: 2,
      numLibres: 3,
    });
  });

  it("rejects a regular user and leaves the street unchanged", async () => {
    const { auth } = await loginAs();
    const calle = await createCalle();
    const res = await api().patch(`/api/calle/${calle._id}`).set("Authorization", auth).send({ name: "Alcalá" });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorMessage: "No eres Admin" });
    expect((await Calles.findById(calle._id)).name).toBe("Gran Vía");
  });
});

describe("DELETE /api/calle/:calleId", () => {
  it("lets an admin delete a street", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle();
    const res = await api().delete(`/api/calle/${calle._id}`).set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toBe("todo bien, documento borrado");
    expect(await Calles.countDocuments()).toBe(0);
  });

  it("rejects a regular user and keeps the street", async () => {
    const { auth } = await loginAs();
    const calle = await createCalle();
    const res = await api().delete(`/api/calle/${calle._id}`).set("Authorization", auth);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ errorMessage: "No eres Admin" });
    expect(await Calles.countDocuments()).toBe(1);
  });
});

describe("favoritos", () => {
  it("adds a favorite once, lists it and removes it", async () => {
    const { user, auth } = await loginAs();
    const calle = await createCalle();
    await createCalle({ name: "Otra" });

    const add = await api().post(`/api/calle/favoritos/${calle._id}`).set("Authorization", auth);
    await api().post(`/api/calle/favoritos/${calle._id}`).set("Authorization", auth);
    expect(add.status).toBe(200);
    expect(add.body).toEqual({ message: "Calle añadida a favoritos" });
    expect((await User.findById(user._id)).favoritos).toHaveLength(1);

    const list = await api().get("/api/calle/favoritos").set("Authorization", auth);
    expect(list.status).toBe(200);
    expect(list.body.map((c) => c.name)).toEqual(["Gran Vía"]);

    const del = await api().delete(`/api/calle/favoritos/${calle._id}`).set("Authorization", auth);
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ message: "Calle eliminada de favoritos" });
    expect((await User.findById(user._id)).favoritos).toHaveLength(0);
  });
});

describe("parking cars on a street", () => {
  it("parks a car once and unparks it", async () => {
    const { user, auth } = await loginAs();
    const calle = await createCalle();
    const car = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const path = `/api/calle/${calle._id}/coches/${car._id}`;

    const park = await api().post(path).set("Authorization", auth);
    await api().post(path).set("Authorization", auth);
    expect(park.status).toBe(200);
    expect(park.body).toEqual({ message: "Coche añadido a la calle" });
    expect((await Calles.findById(calle._id)).coches).toHaveLength(1);

    const unpark = await api().delete(path).set("Authorization", auth);
    expect(unpark.status).toBe(200);
    expect(unpark.body).toEqual({ message: "Coche quitado de la calle" });
    expect((await Calles.findById(calle._id)).coches).toHaveLength(0);
  });

  // Current behavior (pinned): parking does not touch the occupancy counters.
  it("does not update numOcupados or numLibres", async () => {
    const { user, auth } = await loginAs();
    const calle = await createCalle({ numLibres: 10 });
    const car = await Cars.create({ modelo: "Ibiza", owner: user._id });

    await api().post(`/api/calle/${calle._id}/coches/${car._id}`).set("Authorization", auth);

    expect(await Calles.findById(calle._id)).toMatchObject({ numOcupados: 0, numLibres: 10 });
  });
});
