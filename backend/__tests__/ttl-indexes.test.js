import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, test } from "@jest/globals";

import Verification from "../models/verification.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import { startTestDb } from "./helpers/test-env.js";

describe("TTL indexes on Verification + WorkspaceInvite (B5)", () => {
  let stopTestDb;

  beforeAll(async () => {
    const { uri, stop } = await startTestDb();
    stopTestDb = stop;
    await mongoose.connect(uri);
    await Verification.init();
    await WorkspaceInvite.init();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await stopTestDb();
  });

  const hasTtl = async (collectionName) => {
    const indexes = await mongoose.connection.db
      .collection(collectionName)
      .indexes();
    return indexes.some(
      (idx) =>
        idx.key &&
        Object.keys(idx.key).length === 1 &&
        idx.key.expiresAt === 1 &&
        idx.expireAfterSeconds === 0
    );
  };

  test("verifications has a TTL index on expiresAt (expireAfterSeconds: 0)", async () => {
    expect(await hasTtl("verifications")).toBe(true);
  });

  test("workspaceinvites has a TTL index on expiresAt (expireAfterSeconds: 0)", async () => {
    expect(await hasTtl("workspaceinvites")).toBe(true);
  });

  test("a not-yet-expired doc is still findable (no premature deletion)", async () => {
    const doc = await Verification.create({
      userId: new mongoose.Types.ObjectId(),
      token: "ttl-future-token",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    expect(await Verification.findById(doc._id)).not.toBeNull();
  });
});
