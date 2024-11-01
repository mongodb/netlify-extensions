import type * as mongodb from 'mongodb';
import assert from 'node:assert';
import type { Manifest } from '../generateManifest/manifest';
import type { RefreshInfo, SearchDocument } from '../types';
import { generateHash, joinUrl } from '../utils';
import {
  getSearchDb,
  type CollectionConnectionInfo,
} from 'populate-metadata/databaseConnection/atlasClusterConnector';

export const getDocumentsCollection = async ({
  URI,
  databaseName,
  collectionName,
  extensionName,
}: {
  URI: string;
  databaseName: string;
  collectionName: string;
  extensionName: string;
}): //TODO: specify type
Promise<any> => {
  const dbSession = await getSearchDb({
    URI,
    databaseName,
    appName: extensionName,
  });
  return dbSession.collection<mongodb.Document>(collectionName);
};

const composeUpserts = async (
  manifest: Manifest,
  searchProperty: string,
  lastModified: Date,
  hash: string,
) => {
  const documents = manifest.documents;
  return documents.map((document) => {
    assert.strictEqual(typeof document.slug, 'string');
    assert.ok(document.slug || document.slug === '');

    document.strippedSlug = document.slug.replaceAll('/', '');

    const newDocument: SearchDocument = {
      ...document,
      lastModified: lastModified,
      url: joinUrl({ base: manifest.url, path: document.slug }),
      manifestRevisionId: hash,
      searchProperty: [searchProperty],
      includeInGlobalSearch: manifest.global ?? false,
    };

    return {
      updateOne: {
        filter: {
          searchProperty: newDocument.searchProperty,
          slug: newDocument.slug,
        },
        update: { $set: newDocument },
        upsert: true,
      },
    };
  });
};

export const uploadManifest = async ({
  manifest,
  searchProperty,
  connectionInfo,
}: {
  manifest: Manifest;
  searchProperty: string;
  connectionInfo: CollectionConnectionInfo;
}) => {
  //check that manifest documents exist
  //TODO: maybe check other manifest properties as well?
  if (!manifest?.documents?.length) {
    return Promise.reject(new Error('Invalid manifest'));
  }

  const documentsColl = await getDocumentsCollection({
    ...connectionInfo,
  });

  const status: RefreshInfo = {
    deleted: 0,
    upserted: 0,
    modified: 0,
    dateStarted: new Date(),
    //TODO: set elapsed ms ?
    elapsedMS: 0,
  };

  const hash = await generateHash(manifest.toString());
  //TODO: should we add a property for createdAt?
  const lastModified = new Date();

  const upserts = await composeUpserts(
    manifest,
    searchProperty,
    lastModified,
    hash,
  );
  const operations = [...upserts];

  //TODO: make sure url of manifest doesn't have excess leading slashes(as done in getManifests)

  //check property types
  console.info('Starting transaction');
  assert.strictEqual(typeof manifest.global, 'boolean');
  assert.strictEqual(typeof hash, 'string');
  assert.ok(hash);

  try {
    if (operations.length > 0) {
      const bulkWriteStatus = await documentsColl?.bulkWrite(operations, {
        ordered: false,
      });
      status.modified += bulkWriteStatus?.modifiedCount ?? 0;
      status.upserted += bulkWriteStatus?.upsertedCount ?? 0;
    }
    const result = await documentsColl?.deleteMany({
      searchProperty: searchProperty,
      manifestRevisionId: { $ne: hash },
    });
    status.deleted += result?.deletedCount ?? 0;
    return status;
  } catch (e) {
    throw new Error(
      `Error writing upserts to Search.documents collection with error ${e}`,
    );
  } finally {
    // await closeSearchDb();
  }
};
