import { S3Client } from '@aws-sdk/client-s3';

const AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

export const connectToS3 = (): S3Client => {
  if (!AWS_SECRET_ACCESS_KEY || !AWS_ACCESS_KEY_ID) {
    throw new Error('credentials not found');
  }
  const client = new S3Client({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: 'us-east-2',
  });
  return client;
};
