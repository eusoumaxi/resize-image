import 'source-map-support/register';

import AWS from 'aws-sdk';
import { formatJSONResponse } from '@libs/apiGateway';
import { resizeSize } from 'src/utils/size';
import { BAD_REQUEST, INTERNAL_SERVER, NOT_FOUND } from 'src/utils/statusCode';

const S3 = new AWS.S3({
  region: process.env.AWS_REGION,
});

const handler = async (event) => {
  const { id } = event.pathParameters;
  if (!id) {
    return formatJSONResponse(
      {
        error: {
          statusCode: BAD_REQUEST,
          name: 'BadRequestError',
          message: 'ID required',
        },
      },
      BAD_REQUEST,
    );
  }

  const Keys = resizeSize
    .map((v) => ({
      Key: `resize/${v.toString().replace(',', '/')}/${id}`,
    }))
    .concat({ Key: `resize/original/${id}` });

  const listImg = [];
  try {
    await Promise.all(
      Keys.map(async ({ Key }) => {
        try {
          const getObject = await S3.getObject({
            Bucket: process.env.S3_BUCKET_OK,
            Key,
          }).promise();

          listImg.push({
            url: process.env.DOMAIN + '/' + Key,
            name: getObject.Metadata['meta-fieldname'],
            id: getObject.Metadata['meta-id'],
          });
        } catch (error) {
          return undefined;
        }
      }),
    );
    if (listImg.length <= 3) {
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

    return formatJSONResponse({ data: listImg });
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
