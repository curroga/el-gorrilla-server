import { beforeAll, describe, expect, it } from "vitest";
import { api, Cars, connected, loginAs, mongoose } from "./helpers.mjs";

beforeAll(connected);

const carBody = { modelo: "Ibiza", matricula: "1234ABC", color: "rojo" };

describe("authentication on /api/car", () => {
  it("rejects requests without a token", async () => {
    const res = await api().get("/api/car");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ errorMessage: "Token no valido o no hay token" });
  });
});

describe("POST /api/car", () => {
  it("creates a car owned by the logged-in user", async () => {
    const { user, auth } = await loginAs();
    const res = await api().post("/api/car").set("Authorization", auth).send(carBody);

    expect(res.status).toBe(201);
    expect(res.body).toBe("Coche creado en la BD");
    const stored = await Cars.findOne();
    expect(stored).toMatchObject(carBody);
    expect(stored.owner.toString()).toBe(user._id.toString());
  });
});

describe("GET /api/car", () => {
  it("lists only the logged-in user's cars", async () => {
    const { user, auth } = await loginAs({ username: "ana" });
    const { user: other } = await loginAs({ username: "luis" });
    await Cars.create({ ...carBody, owner: user._id });
    await Cars.create({ ...carBody, matricula: "9999ZZZ", owner: other._id });

    const res = await api().get("/api/car").set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.matricula)).toEqual(["1234ABC"]);
  });
});

describe("GET /api/car/:carId", () => {
  it("returns the car details", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ ...carBody, owner: user._id });
    const res = await api().get(`/api/car/${car._id}`).set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ _id: car._id.toString(), ...carBody });
  });

  // Current behavior (pinned): an unknown id is not a 404.
  it("answers 200 with null for an unknown id", async () => {
    const { auth } = await loginAs();
    const id = new mongoose.Types.ObjectId();
    const res = await api().get(`/api/car/${id}`).set("Authorization", auth);
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("PATCH /api/car/:carId", () => {
  it("updates the car", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ ...carBody, owner: user._id });
    const res = await api().patch(`/api/car/${car._id}`).set("Authorization", auth).send({ ...carBody, color: "azul" });

    expect(res.status).toBe(200);
    expect(res.body).toBe("Coche actualizado");
    expect((await Cars.findById(car._id)).color).toBe("azul");
  });
});

describe("DELETE /api/car/:carId", () => {
  it("deletes the car", async () => {
    const { user, auth } = await loginAs();
    const car = await Cars.create({ ...carBody, owner: user._id });
    const res = await api().delete(`/api/car/${car._id}`).set("Authorization", auth);

    expect(res.status).toBe(200);
    expect(res.body).toBe("Coche borrado");
    expect(await Cars.countDocuments()).toBe(0);
  });
});

// Current behavior (pinned): by-id routes do not check ownership, so any
// logged-in user can read, edit or delete someone else's car.
describe("ownership on /api/car/:carId", () => {
  it("lets another user read, edit and delete a car they do not own", async () => {
    const { user: owner } = await loginAs({ username: "ana" });
    const { auth: intruder } = await loginAs({ username: "luis" });
    const car = await Cars.create({ ...carBody, owner: owner._id });

    const read = await api().get(`/api/car/${car._id}`).set("Authorization", intruder);
    expect(read.status).toBe(200);
    expect(read.body.matricula).toBe("1234ABC");

    const edit = await api().patch(`/api/car/${car._id}`).set("Authorization", intruder).send({ color: "negro" });
    expect(edit.status).toBe(200);
    expect((await Cars.findById(car._id)).color).toBe("negro");

    const del = await api().delete(`/api/car/${car._id}`).set("Authorization", intruder);
    expect(del.status).toBe(200);
    expect(await Cars.countDocuments()).toBe(0);
  });
});
