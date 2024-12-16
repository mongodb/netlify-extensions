import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import type { S3UploadParams } from 'util/s3Connection/types';
import { assertTrailingSlash } from '../utils';
import { connectToS3 } from './connectToS3';

const upload = async (
  client: S3Client,
  params: { Bucket: string; Key: string; Body: string },
) => {
  try {
    const command = new PutObjectCommand(params);
    const response = await client.send(command);
    return response;
  } catch (e) {
    throw new Error(`Error uploading manifests to s3 ${e}`);
  }
};

export const uploadManifestToS3 = async ({
  uploadParams,
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
}: {
  uploadParams: S3UploadParams;
  AWS_S3_ACCESS_KEY_ID: string;
  AWS_S3_SECRET_ACCESS_KEY: string;
}) => {
  // TODO: possibly also ensure there isn't a double trailing slash here to begin with ?? (although idk why there would be)
  const prefix = assertTrailingSlash(uploadParams.prefix);
  const key = prefix + uploadParams.fileName;
  const client = connectToS3(AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY);
  const uploadStatus = await upload(client, {
    Bucket: uploadParams.bucket,
    Key: key,
    Body: uploadParams.obj,
  });
  return uploadStatus;
};
