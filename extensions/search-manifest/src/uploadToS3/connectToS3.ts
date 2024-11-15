import { S3Client } from '@aws-sdk/client-s3';

export const connectToS3 = (
  AWS_S3_ACCESS_KEY_ID: string,
  AWS_S3_SECRET_ACCESS_KEY: string,
): S3Client => {
  if (!AWS_S3_SECRET_ACCESS_KEY || !AWS_S3_ACCESS_KEY_ID) {
    throw new Error('credentials not found');
  }
  const client = new S3Client({
    credentials: {
      accessKeyId: AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
    },
    region: 'us-east-2',
  });
  return client;
};
