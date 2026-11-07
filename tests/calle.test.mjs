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
    expect(res.body[0]).toMatchObject({ name: "Gran Vía", numAparcamientos: 10, numOcupados: 1, numLibres: 9 });
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

  it("rejects a regular user with 401 and stores nothing", async () => {
    const { auth } = await loginAs();
    const res = await api().post("/api/calle").set("Authorization", auth).send(newCalleBody);

    expect(res.status).toBe(401);
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

  // Current behavior (pinned): an unknown id is not a 404.
  it("answers 200 with null for an unknown id", async () => {
    const { auth } = await loginAs();
    const res = await api().get(`/api/calle/${unknownId()}`).set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });

  // Current behavior (pinned): a malformed id becomes a 500.
  it("answers 500 for a malformed id", async () => {
    const { auth } = await loginAs();
    const res = await api().get("/api/calle/not-an-id").set("Authorization", auth);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error. Check the server console" });
  });
});

describe("PATCH /api/calle/:calleId", () => {
  it("lets an admin update a street", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle();
    const res = await api()
      .patch(`/api/calle/${calle._id}`)
      .set("Authorization", auth)
      .send({ name: "Alcalá", numAparcamientos: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toBe("todo bien, documento actualizado");
    const details = await api().get(`/api/calle/${calle._id}`).set("Authorization", auth);
    expect(details.body).toMatchObject({ name: "Alcalá", numAparcamientos: 5, numOcupados: 0, numLibres: 5 });
  });

  it("ignores numOcupados and numLibres sent by the client", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle();
    await api()
      .patch(`/api/calle/${calle._id}`)
      .set("Authorization", auth)
      .send({ name: "Alcalá", numAparcamientos: 5, numOcupados: 2, numLibres: 3 });

    const details = await api().get(`/api/calle/${calle._id}`).set("Authorization", auth);
    expect(details.body).toMatchObject({ numAparcamientos: 5, numOcupados: 0, numLibres: 5 });
  });

  it("rejects a regular user and leaves the street unchanged", async () => {
    const { auth } = await loginAs();
    const calle = await createCalle();
    const res = await api().patch(`/api/calle/${calle._id}`).set("Authorization", auth).send({ name: "Alcalá" });

    expect(res.status).toBe(401);
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

    expect(res.status).toBe(401);
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

  it("computes numOcupados and numLibres from the parked cars", async () => {
    const { user, auth } = await loginAs();
    const calle = await createCalle();
    const car = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const path = `/api/calle/${calle._id}/coches/${car._id}`;
    const details = () => api().get(`/api/calle/${calle._id}`).set("Authorization", auth);

    await api().post(path).set("Authorization", auth);
    expect((await details()).body).toMatchObject({ numAparcamientos: 10, numOcupados: 1, numLibres: 9 });

    await api().delete(path).set("Authorization", auth);
    expect((await details()).body).toMatchObject({ numAparcamientos: 10, numOcupados: 0, numLibres: 10 });
  });

  it("uses a legacy stored numOcupados as the admin adjustment and ignores stored numLibres", async () => {
    const { auth } = await loginAs();
    const { insertedId } = await Calles.collection.insertOne({
      name: "Legacy", numAparcamientos: 4, numOcupados: 3, numLibres: 7, coches: [],
    });

    const res = await api().get(`/api/calle/${insertedId}`).set("Authorization", auth);
    expect(res.body).toMatchObject({ numAparcamientos: 4, ocupadosExternos: 3, numOcupados: 3, numLibres: 1 });
  });

  it("counts the admin adjustment as occupied spaces", async () => {
    const { user, auth } = await loginAs({ role: "admin" });
    const car = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const calle = await createCalle({ numAparcamientos: 10, coches: [car._id] });

    const res = await api().patch(`/api/calle/${calle._id}`).set("Authorization", auth).send({ ocupadosExternos: "3" });
    expect(res.status).toBe(200);

    const details = await api().get(`/api/calle/${calle._id}`).set("Authorization", auth);
    expect(details.body).toMatchObject({ numAparcamientos: 10, ocupadosExternos: 3, numOcupados: 4, numLibres: 6 });
  });

  it("an explicit adjustment of 0 overrides a legacy stored numOcupados", async () => {
    const { auth } = await loginAs({ role: "admin" });
    const { insertedId } = await Calles.collection.insertOne({
      name: "Legacy", numAparcamientos: 4, numOcupados: 3, coches: [],
    });

    await api().patch(`/api/calle/${insertedId}`).set("Authorization", auth).send({ ocupadosExternos: 0 });

    const details = await api().get(`/api/calle/${insertedId}`).set("Authorization", auth);
    expect(details.body).toMatchObject({ ocupadosExternos: 0, numOcupados: 0, numLibres: 4 });
  });

  it.each([[-1], ["abc"], [1.5], [""], [null], [" "], [true], [[3]], ["1e1"]])("rejects the adjustment %j with 400 and changes nothing", async (value) => {
    const { auth } = await loginAs({ role: "admin" });
    const calle = await createCalle({ ocupadosExternos: 2 });

    const res = await api().patch(`/api/calle/${calle._id}`).set("Authorization", auth).send({ name: "Alcalá", ocupadosExternos: value });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMessage: "ocupadosExternos debe ser un número entero mayor o igual que 0" });
    expect(await Calles.findById(calle._id)).toMatchObject({ name: "Gran Vía", ocupadosExternos: 2 });
  });

  it.each([[-1], [1.5], ["2"]])("counts an invalid legacy numOcupados %j as 0 when reading and parking", async (legacy) => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ modelo: "León", owner: user._id });
    const { insertedId } = await Calles.collection.insertOne({
      name: "Legacy", numAparcamientos: 1, numOcupados: legacy, coches: [],
    });

    const details = await api().get(`/api/calle/${insertedId}`).set("Authorization", auth);
    expect(details.body).toMatchObject({ numOcupados: 0, numLibres: 1 });

    const park = await api().post(`/api/calle/${insertedId}/coches/${car._id}`).set("Authorization", auth);
    expect(park.status).toBe(200);
    const after = await api().get(`/api/calle/${insertedId}`).set("Authorization", auth);
    expect(after.body).toMatchObject({ numOcupados: 1, numLibres: 0 });
  });

  it("rejects parking with 409 when the admin adjustment fills the street", async () => {
    const { user, auth } = await loginAs();
    const parked = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const car = await Cars.create({ modelo: "León", owner: user._id });
    const calle = await createCalle({ numAparcamientos: 2, ocupadosExternos: 1, coches: [parked._id] });

    const res = await api().post(`/api/calle/${calle._id}/coches/${car._id}`).set("Authorization", auth);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ errorMessage: "No hay plazas libres" });
    expect((await Calles.findById(calle._id)).coches).toHaveLength(1);
  });

  it("rejects parking with 409 when a legacy stored numOcupados fills the street", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ modelo: "León", owner: user._id });
    const { insertedId } = await Calles.collection.insertOne({
      name: "Legacy", numAparcamientos: 2, numOcupados: 2, coches: [],
    });

    const res = await api().post(`/api/calle/${insertedId}/coches/${car._id}`).set("Authorization", auth);

    expect(res.status).toBe(409);
    expect((await Calles.collection.findOne({ _id: insertedId })).coches).toEqual([]);
  });

  it("rejects parking on a full street with 409 and changes nothing", async () => {
    const { user, auth } = await loginAs();
    const parked = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const car = await Cars.create({ modelo: "León", owner: user._id });
    const calle = await createCalle({ numAparcamientos: 1, coches: [parked._id] });

    const res = await api().post(`/api/calle/${calle._id}/coches/${car._id}`).set("Authorization", auth);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ errorMessage: "No hay plazas libres" });
    expect((await Calles.findById(calle._id)).coches.map(String)).toEqual([parked._id.toString()]);
  });

  it("parks on a legacy street stored without a coches field", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const { insertedId } = await Calles.collection.insertOne({ name: "Legacy", numAparcamientos: 2 });

    const res = await api().post(`/api/calle/${insertedId}/coches/${car._id}`).set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Coche añadido a la calle" });
    expect((await Calles.findById(insertedId)).coches.map(String)).toEqual([car._id.toString()]);
  });

  it("parking a car already on a full street is a no-op, not a 409", async () => {
    const { user, auth } = await loginAs();
    const parked = await Cars.create({ modelo: "Ibiza", owner: user._id });
    const calle = await createCalle({ numAparcamientos: 1, coches: [parked._id] });

    const res = await api().post(`/api/calle/${calle._id}/coches/${parked._id}`).set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Coche añadido a la calle" });
    expect((await Calles.findById(calle._id)).coches).toHaveLength(1);
  });
});
