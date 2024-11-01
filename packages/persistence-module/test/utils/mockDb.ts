import * as mongodb from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let client: mongodb.MongoClient;

export async function teardownMockDbClient() {
  if (!client) return;

  await client.close();
}

export async function getMockDbClient() {
  if (client) {
    await client.connect();
    return client;
  }
  const mongod = await MongoMemoryServer.create();

  const uri = mongod.getUri();
  client = new mongodb.MongoClient(uri);
  await client.connect();
  return client;
}

export async function getMockDb() {
  const client = await getMockDbClient();
  return client.db('test_db');
}
