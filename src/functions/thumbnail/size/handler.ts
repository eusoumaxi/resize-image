import 'source-map-support/register';

import AWS from 'aws-sdk';

import { formatJSONResponse } from '@libs/apiGateway';
import { resizeImg } from '@libs/image';
import { INTERNAL_SERVER, NOT_FOUND, OK } from 'src/utils/statusCode';

const S3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const handler = async (event) => {
  const { id, height, width } = event.pathParameters;
  try {
    if (!id || isNaN(Number(height)) || isNaN(Number(width))) {
      return formatJSONResponse(
        {
          error: {
            statusCode: 400,
            name: 'BadRequestError',
            message: 'The uploaded document does not meet the criteria.',
          },
        },
        400,
      );
    }

    const getObject = await S3.getObject({
      Bucket: process.env.S3_BUCKET_OK,
      Key: `resize/original/${id}`,
    }).promise();

    const changeResize = await resizeImg(getObject.Body as Buffer, [
      Number(Number(height).toFixed()),
      Number(Number(width).toFixed()),
    ]);

    return {
      headers: {
        'Content-Type': getObject.ContentType,
        'Content-Length': changeResize.length,
      },
      statusCode: OK,
      body: changeResize.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error(error);

    if (error.statusCode === NOT_FOUND) {
      return formatJSONResponse(
        {
          error: {
            statusCode: NOT_FOUND,
            name: 'NotFoundError',
            message: `The consultant id is not yet available`,
            id,
          },
        },
        NOT_FOUND,
      );
    }
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
