import { PutObjectCommand, type S3Client } from '@aws-sdk/client-s3';
import { connectToS3 } from './connectToS3';
import { normalize } from 'node:path';

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

export interface S3UploadInfo {
  prefix: string;
  fileName: string;
  bucket: string;
  body: string;
  AWS_S3_ACCESS_KEY_ID: string;
  AWS_S3_SECRET_ACCESS_KEY: string;
}
export const uploadManifestToS3 = async ({
  prefix,
  fileName,
  bucket,
  body,
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY,
}: S3UploadInfo) => {
  const key = normalize(`/${prefix}/${fileName}`);
  const client = connectToS3(AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY);
  const uploadStatus = await upload(client, {
    Bucket: bucket,
    Key: key,
    Body: body,
  });
  return uploadStatus;
};
