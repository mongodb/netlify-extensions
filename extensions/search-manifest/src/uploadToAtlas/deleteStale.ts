import {
  closeSearchDb,
  type CollectionConnectionInfo,
} from 'util/databaseConnection/atlasClusterConnector';
import { getDocumentsCollection } from 'util/databaseConnection/fetchSearchData';

export const deleteStaleDocuments = async ({
  searchProperty,
  manifestRevisionId,
}: {
  searchProperty: string;
  manifestRevisionId: string;
}) => {
  console.log(
    `Removing stale documents with search property ${searchProperty} `,
  );
  return {
    deleteMany: {
      filter: {
        searchProperty: searchProperty,
        manifestRevisionId: { $ne: manifestRevisionId },
      },
    },
  };
};

export const deleteStaleProperties = async (
  searchProperty: string,
  connectionInfo: CollectionConnectionInfo,
) => {
  const documentsColl = await getDocumentsCollection({ ...connectionInfo });
  console.info(`Removing all documents with stale property ${searchProperty}`);
  const query = { searchProperty: { $regex: searchProperty } };
  try {
    const status = await documentsColl?.deleteMany(query);
    return status;
  } catch (e) {
    console.info(
      `Error removing stale property ${searchProperty} in database ${connectionInfo.databaseName}, collection ${connectionInfo.collectionName}: ${e}`,
    );
  } finally {
    closeSearchDb();
  }
};
