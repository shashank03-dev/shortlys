import dotenv from "dotenv";

export function testEnvironment(suite) {
  dotenv.config({ path: ".env.test", quiet: true });
  const database = new URL(process.env.DATABASE_URL);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)) {
    throw new Error("Tests require a local MongoDB replica set.");
  }
  database.pathname = `/shortlys_${suite}_test`;
  return { DATABASE_URL: database.toString() };
}
