// import * as mongodb from 'mongodb';
// import type {
//   DocsetsDocument,
//   ReposBranchesDocument,
// } from 'util/databaseConnection/types';
// import type { SearchDocument } from 'util/databaseConnection/fetchSearchData';

// let searchDb: mongodb.MongoClient;
// let clusterZeroClient: mongodb.MongoClient;

// export const teardown = async (client: mongodb.MongoClient) => {
//   await client.close();
// };

// // Handles memoization of db object, and initial connection logic if needs to be initialized
// export const dbClient = async (uri: string) => {
//   const client = new mongodb.MongoClient(uri);
//   try {
//     await client.connect();
//     return client;
//   } catch (error) {
//     const err = `Error at client connection: ${error} `;
//     console.error(err);
//     throw err;
//   }
// };

// export const getSearchDb = async () => {
//   console.log('Getting Search Db');
//   if (searchDb) {
//     console.log('Search Db client already exists, using existing instance');
//   } else {
//     searchDb = await dbClient(ENV_VARS.ATLAS_SEARCH_URI);
//   }
//   return searchDb.db(ENV_VARS.SEARCH_DB_NAME);
// };

// export const getSnootyDb = async () => {
//   console.log('Getting Snooty Db');

//   if (clusterZeroClient) {
//     console.log('Cluster Zero client already exists, using existing instance');
//   } else {
//     clusterZeroClient = await dbClient(ENV_VARS.ATLAS_CLUSTER0_URI);
//   }
//   return clusterZeroClient.db(ENV_VARS.SNOOTY_DB_NAME);
// };

// export const closeSnootyDb = async () => {
//   if (clusterZeroClient) await teardown(clusterZeroClient);
//   else {
//     console.log('No client connection open to Snooty Db');
//   }
// };

// export const closeSearchDb = async () => {
//   if (searchDb) await teardown(searchDb);
//   else {
//     console.log('No client connection open to Search Db');
//   }
// };

// export const getDocsetsCollection = async () => {
//   const dbSession = await getSnootyDb();
//   return dbSession.collection<DocsetsDocument>(ENV_VARS.DOCSETS_COLLECTION);
// };

// export const getReposBranchesCollection = async () => {
//   const dbSession = await getSnootyDb();
//   return dbSession.collection<ReposBranchesDocument>(
//     ENV_VARS.REPOS_BRANCHES_COLLECTION,
//   );
// };

// export const getDocumentsCollection = async () => {
//   const dbSession = await getSearchDb();
//   return dbSession.collection<SearchDocument>(ENV_VARS.DOCUMENTS_COLLECTION);
// };
