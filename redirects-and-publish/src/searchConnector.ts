import type { Db } from "mongodb";
import * as mongodb from "mongodb";
import type { DatabaseDocument } from "./types";

// We should only ever have one client active at a time.
// cached db object, so we can handle initial connection process once if unitialized
// this file is based off of searchConnector.ts from search-manifest

const ATLAS_CLUSTER0_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_CLUSTER0_HOST}/?retryWrites=true&w=majority`;
const SNOOTY_DB_NAME = `${process.env.MONGO_ATLAS_POOL_DB_NAME}`;

const ATLAS_SEARCH_URI = `mongodb+srv://${process.env.MONGO_ATLAS_USERNAME}:${process.env.MONGO_ATLAS_PASSWORD}@${process.env.MONGO_ATLAS_SEARCH_HOST}/?retryWrites=true&w=majority`;
//TODO: change these teamwide env vars in Netlify UI when ready to move to prod
const SEARCH_DB_NAME = `${process.env.MONGO_ATLAS_SEARCH_DB_NAME}`;

let searchDbClient: mongodb.MongoClient;
let snootyDbClient: mongodb.MongoClient;

// Handles memoization of db object, and initial connection logic if needs to be initialized
export const db = async ({ uri, dbName }: { uri: string; dbName: string }) => {
	const client = new mongodb.MongoClient(uri);
	try {
		await client.connect();
		const dbInstance = client.db(dbName);
		return dbInstance;
	} catch (error) {
		const err = `Error at db client connection: ${error} for uri ${uri} and db name ${dbName}`;
		console.error(err);
		throw err;
	}
};

export const getSearchDb = async () => {
	console.log("getting search db");
	const uri = ATLAS_SEARCH_URI;
	const dbName = SEARCH_DB_NAME;
	const searchDbClient = await db({ uri, dbName });
	return searchDbClient;
};

export const getSnootyDb = async () => {
    console.log("getting snooty db");
	const uri = ATLAS_CLUSTER0_URI;
	const dbName = SNOOTY_DB_NAME;
	const snootyDbClient = await db({ uri, dbName });
	return snootyDbClient;
};

export const getCollection = (dbSession: Db, collection: string) => {
	try {
		return dbSession.collection<DatabaseDocument>(collection);
	} catch (e) {
		throw new Error(
			`Error getting ${collection} collection from client: ${dbSession}`,
		);
	}
};