import 'source-map-support/register';

import parser from 'lambda-multipart-parser';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

import { isPng, isJpg } from '@libs/image';
import { formatJSONResponse } from '@libs/apiGateway';
import { BAD_REQUEST, CREATED, INTERNAL_SERVER } from 'src/utils/statusCode';

const S3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const handler = async (event) => {
  try {
    const { files } = await parser.parse(event);
    const fileImage = files[0];

    if (
      !files.length ||
      fileImage.content.toString().length / 1024 >= 5120 ||
      !(isJpg(fileImage.content) || isPng(fileImage.content))
    ) {
      return formatJSONResponse(
        {
          error: {
            statusCode: BAD_REQUEST,
            name: 'BadRequestError',
            message: 'The uploaded document does not meet the criteria.',
          },
        },
        BAD_REQUEST,
      );
    }

    const id = nanoid(5);

    const newName =
      id + '-' + fileImage.filename.replace(/[^A-Za-z0-9.]+/g, '');
    await S3.upload({
      Key: newName,
      Body: fileImage.content,
      ContentType: fileImage.contentType,
      Bucket: process.env.S3_BUCKET_PROCESS,
      Metadata: {
        ['meta-fieldname']: fileImage.filename,
        ['meta-id']: id,
        ['meta-resize']: 'original',
      },
    }).promise();

    return formatJSONResponse(
      {
        message:
          'The image is being processed. Verify track in a couple of minutes.',
        track: `${process.env.DOMAIN}/thumbnail/${newName}`,
        name: newName,
        id,
      },
      CREATED,
    );
  } catch (error) {
    console.error(error);
    return formatJSONResponse(
      {
        error: {
          statusCode: INTERNAL_SERVER,
          name: 'ServerRequestError',
          message: 'An internal error occurred.',
        },
      },
      INTERNAL_SERVER,
    );
  }
};

export const main = handler;
