import type { CollectionConnectionInfo } from 'populate-metadata/databaseConnection/atlasClusterConnector';
import { getDocumentsCollection } from 'populate-metadata/databaseConnection/fetchSearchData';

//TODO: is this needed???
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
  const documentsColl = await getDocumentsCollection(connectionInfo);
  console.debug(`Removing all documents with stale property ${searchProperty}`);
  const query = { searchProperty: { $regex: searchProperty } };
  const status = await documentsColl?.deleteMany(query);
  return status;
};
