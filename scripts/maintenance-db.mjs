import { MongoClient } from "mongodb";

export async function withDatabase(operation) {
  if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL before running maintenance.");
  const client = new MongoClient(process.env.DATABASE_URL);
  try {
    await client.connect();
    console.log(JSON.stringify(await operation(client.db())));
  } finally {
    await client.close();
  }
}
