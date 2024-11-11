import * as mongodb from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type {
  DocsetsDocument,
  ReposBranchesDocument,
  SearchDocument,
} from '../../src/types';

let client: mongodb.MongoClient;

export async function teardownMockDbClient() {
  if (!client) return;
  await client.close();
}

export async function mockDb(): Promise<mongodb.Db> {
  if (client) {
    await client.connect();
    return client.db('dummy_db');
  }
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  client = new mongodb.MongoClient(uri);
  await client.connect();
  const dbInstance = client.db('dummy_db');
  return dbInstance;
}
export const getSearchDb = async () => {
  const db = await mockDb();
  return db;
};
export const getSnootyDb = async () => {
  const db = await mockDb();
  return db;
};

export const getDocumentsCollection = async () => {
  const dbSession = await getSearchDb();
  return dbSession.collection<SearchDocument>('documents');
};

export const getReposBranchesCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<SearchDocument>('repos_branches');
};

export const getDocsetsCollection = async () => {
  const dbSession = await getSnootyDb();
  return dbSession.collection<SearchDocument>('docsets');
};

export const insert = async (
  dbName: mongodb.Db,
  collectionName: string,
  docs: Array<ReposBranchesDocument> | Array<DocsetsDocument>,
) => {
  const coll = dbName.collection(collectionName);
  const result = await coll.insertMany(docs);
  console.log(`${result.insertedCount} documents were inserted`);
};

export const removeDocuments = async (collectionName: string) => {
  //delete all documents in repo
  const db = await mockDb();
  await (await getDocumentsCollection()).deleteMany({});
  const documentCount = await db
    .collection<SearchDocument>('documents')
    .countDocuments();
  return documentCount;
};
