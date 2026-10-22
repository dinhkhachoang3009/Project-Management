import { jest, describe, test, expect } from "@jest/globals";
import jwt from "jsonwebtoken";
import { TEST_JWT_SECRET } from "./helpers/test-env.js";

process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.NODE_ENV = "test";

const mockFindById = jest.fn();

jest.unstable_mockModule("../models/user.js", () => ({
  __esModule: true,
  default: { findById: (id) => mockFindById(id) },
}));

const { default: authMiddleware } = await import(
  "../middleware/auth-middleware.js"
);

const stub = { _id: "u1", name: "Lean User", email: "lean@test.local", profilePicture: null };
const chain = {
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue(stub),
};

describe("auth middleware lean + projection (G1)", () => {
  test("projects the four identity fields and leans the lookup", async () => {
    mockFindById.mockClear().mockReturnValue(chain);
    chain.select.mockClear();
    chain.lean.mockClear().mockResolvedValue(stub);

    const tok = jwt.sign({ userId: "u1" }, TEST_JWT_SECRET, { expiresIn: "1d" });
    const req = { headers: { authorization: `Bearer ${tok}` } };
    const next = jest.fn();

    await authMiddleware(req, {}, next);

    expect(mockFindById).toHaveBeenCalledWith("u1");
    expect(chain.select).toHaveBeenCalledWith("_id name email profilePicture");
    expect(chain.lean).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(stub);
  });

  test("missing user still short-circuits 401 without next", async () => {
    mockFindById.mockReturnValue({ select: () => ({ lean: async () => null }) });

    const tok = jwt.sign({ userId: "gone" }, TEST_JWT_SECRET, { expiresIn: "1d" });
    const req = { headers: { authorization: `Bearer ${tok}` } };
    const next = jest.fn();

    await authMiddleware(req, { status: (code) => ({ json: (body) => { expect(code).toBe(401); expect(body.message).toBe("Unauthorized"); } }) }, next);

    expect(next).not.toHaveBeenCalled();
  });
});
