import { createReadStream } from 'node:fs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const AWS_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY;
const AWS_ACCESS_KEY_ID = process.env.AWS_S3_ACCESS_KEY_ID;

let client: S3Client;

export const getClient = () => {
  if (client) return client;
  if (!AWS_SECRET_ACCESS_KEY || !AWS_ACCESS_KEY_ID) {
    throw new Error('credentials not found');
  }
  const newClient = new S3Client({
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
    region: 'us-east-2',
  });

  client = newClient;
  return client;
};

export const uploadToS3 = async (
  filepath: string,
  bucketName: string,
  fileName: string,
) => {
  const client = getClient();
  const fileStream = createReadStream(filepath);
  if (!bucketName || !fileName) {
    throw new Error('Missing bucketname or filename');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: `docs/offline/${fileName}`,
    ContentEncoding: 'gzip',
    Body: fileStream,
  });

  return client.send(command);
};

export const destroyClient = () => {
  if (client) {
    client.destroy();
  }
};
