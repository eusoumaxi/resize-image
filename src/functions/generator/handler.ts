import 'source-map-support/register';
import AWS from 'aws-sdk';

import { EventS3Put } from 'thumbnail/types/aws/eventbridge';
import { resizeImg } from '@libs/image';
import { resizeSize } from '../../utils/size';

const S3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const generator = async (event: EventS3Put) => {
  const data = event.Records[0];

  // GET OBJECT
  const getObject = await S3.getObject({
    Bucket: process.env.S3_BUCKET_PROCESS,
    Key: data.s3.object.key,
  }).promise();

  // NEW RESIZE
  await Promise.all(
    resizeSize.map(async (size) => {
      const changeResize = await resizeImg(getObject.Body as Buffer, size);
      const setSize = size.toString().replace(',', 'X');

      await S3.upload({
        Key: `resize/${size[0]}/${size[1]}/${data.s3.object.key}`,
        Body: changeResize,
        ContentType: getObject.ContentType,
        Bucket: process.env.S3_BUCKET_OK,
        Metadata: {
          ...getObject.Metadata,
          ['meta-resize']: setSize,
        },
      }).promise();
    }),
  );

  // ORIGINAL DOCUMENT
  await S3.copyObject({
    Bucket: process.env.S3_BUCKET_OK,
    CopySource: `${process.env.S3_BUCKET_PROCESS}/${data.s3.object.key}`,
    Key: `resize/original/${data.s3.object.key}`,
    Metadata: getObject.Metadata,
  }).promise();

  // DELETE OBJECT
  await S3.deleteObject({
    Bucket: process.env.S3_BUCKET_PROCESS,
    Key: data.s3.object.key,
  }).promise();

  return event;
};

export const main = generator;
