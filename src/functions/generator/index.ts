import { FunctionHandler } from 'thumbnail/types/aws/functions';

const lambda: FunctionHandler = {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      s3: {
        bucket: '${self:provider.environment.S3_BUCKET_PROCESS}',
        event: 's3:ObjectCreated:Put',
        existing: true,
      },
    },
  ],
};

export default lambda;
