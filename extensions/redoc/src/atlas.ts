import { COLLECTION_NAME, db } from './utils/db';

const env = process.env.SNOOTY_ENV ?? '';

const OAS_FILE_SERVER =
  env === 'dotcomprd'
    ? 'https://mongodb-mms-prod-build-server.s3.amazonaws.com/openapi/'
    : 'https://mongodb-mms-build-server.s3.amazonaws.com/openapi/';

const GIT_HASH_URL =
  env === 'dotcomprd'
    ? 'https://cloud.mongodb.com/version'
    : 'https://cloud-dev.mongodb.com/version';

export interface OASFile {
  api: string;
  fileContent: string;
  gitHash: string;
  lastUpdated: string;
  versions: VersionData;
}

export type OASFilePartial = Pick<OASFile, 'gitHash' | 'versions'>;

export const findLastSavedVersionData = async (apiKeyword: string) => {
  const dbSession = await db();
  try {
    const projection = { gitHash: 1, versions: 1 };
    const filter = { api: apiKeyword };
    const oasFilesCollection = dbSession.collection<OASFile>(COLLECTION_NAME);
    return oasFilesCollection.findOne<OASFilePartial>(filter, {
      projection,
    });
  } catch (error) {
    console.error(`Error fetching lastest git hash for API: ${apiKeyword}.`);
    throw error;
  }
};
interface AtlasSpecUrlParams {
  apiKeyword: string;
  apiVersion?: string;
  resourceVersion?: string;
  latestResourceVersion?: string;
}

export const getAtlasSpecUrl = async ({
  apiKeyword,
  apiVersion,
  resourceVersion,
  latestResourceVersion,
}: AtlasSpecUrlParams) => {
  // Currently, the only expected API fetched programmatically is the Cloud Admin API,
  // but it's possible to have more in the future with varying processes.
  const keywords = ['cloud'];
  if (!keywords.includes(apiKeyword)) {
    throw new Error(`${apiKeyword} is not a supported API for building.`);
  }

  const versionExtension = `${
    apiVersion ? `-v${apiVersion.split('.')[0]}` : ''
  }${
    apiVersion && resourceVersion
      ? `-${resourceVersion}`
      : apiVersion && latestResourceVersion && !resourceVersion
        ? `-${latestResourceVersion}`
        : ''
  }`;

  let oasFileURL: string | undefined;
  let successfulGitHash = true;

  try {
    const gitHash = await fetchGitHash();
    oasFileURL = `${OAS_FILE_SERVER}${gitHash}${versionExtension}.json`;

    // Sometimes the latest git hash might not have a fully available spec file yet.
    // If this is the case, we should default to using the last successfully saved
    // hash in our database.
    await fetchTextData(oasFileURL, `Error fetching data from ${oasFileURL}`);
  } catch (e) {
    const unsuccessfulOasFileURL = oasFileURL;
    successfulGitHash = false;

    const res = await findLastSavedVersionData(apiKeyword);
    if (res) {
      ensureSavedVersionDataMatches(res.versions, apiVersion, resourceVersion);
      oasFileURL = `${OAS_FILE_SERVER}${res.gitHash}${versionExtension}.json`;
      console.log(`Error occurred fetching from newest OAS spec at ${unsuccessfulOasFileURL}.\n
      This error is a rare but expected result of upload timing between gitHashes and specs.\n
      If you see this error multiple times, let the DOP team know!\n\n
      Using last successfully fetched OAS spec at ${oasFileURL}!`);
    } else {
      throw new Error(`Could not find a saved hash for API: ${apiKeyword}`);
    }
  }

  return {
    oasFileURL,
    successfulGitHash,
  };
};

const fetchTextData = async (url: string, errMsg: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // Error should be caught when creating pages.
    throw new Error(`${errMsg}; ${res.statusText}`);
  }
  return res.text();
};
export interface VersionData {
  [k: string]: string[];
}
function ensureSavedVersionDataMatches(
  versions: VersionData,
  apiVersion?: string,
  resourceVersion?: string,
) {
  // Check that requested versions are included in saved version data
  if (apiVersion) {
    if (
      !versions.major.includes(apiVersion) ||
      (resourceVersion && !versions[apiVersion].includes(resourceVersion))
    ) {
      throw new Error(`Last successful build data does not include necessary version data:\n
      Version requested: ${apiVersion}${
        resourceVersion ? ` - ${resourceVersion}` : ''
      }`);
    }
  }
}

function createFetchGitHash() {
  let gitHashCache: string;
  return {
    fetchGitHash: async () => {
      if (gitHashCache) return gitHashCache;
      try {
        const gitHash = await fetchTextData(
          GIT_HASH_URL,
          'Could not find current version or git hash',
        );
        gitHashCache = gitHash;
        return gitHash;
      } catch (e) {
        console.error(e);
        throw new Error('Unsuccessful git hash fetch');
      }
    },
    resetGitHashCache: () => {
      gitHashCache = '';
    },
  };
}

const { fetchGitHash, resetGitHashCache } = createFetchGitHash();
