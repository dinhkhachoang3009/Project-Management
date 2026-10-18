import { MongoMemoryServer } from "mongodb-memory-server";

export const TEST_JWT_SECRET = "test-secret-part-a-0123456789abcdef";

// A VALID bcrypt hash (of "dummy-password-for-tests") for fixtures that need
// a real hash — e.g. change-password tests compare against it.
export const DUMMY_BCRYPT_HASH =
  "$2b$10$zQ2KIFdVKljsuTbTn9JywudhoySEt5HK9sUryS33LerTWuRg630Ie";

// Test environment defaults. Forced unconditionally: importing the app chain
// loads backend/.env via libs/send-email.js's dotenv.config(), so the real
// secret can already be present here — tests must always sign/verify against
// the known test secret, never the developer's .env values.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = TEST_JWT_SECRET;

// Starts one in-memory mongod per suite; callers mongoose.connect(uri) in
// beforeAll and must call stop() in afterAll.
export const startTestDb = async () => {
  const mongod = await MongoMemoryServer.create();
  return { uri: mongod.getUri(), stop: () => mongod.stop() };
};
