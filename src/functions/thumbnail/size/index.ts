import { FunctionHandler } from 'thumbnail/types/aws/functions';

const lambda: FunctionHandler = {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      http: {
        response: {
          contentHandling: 'CONVERT_TO_BINARY',
        },
        method: 'get',
        path: 'resize/{height}/{width}/{id}',
      },
    },
  ],
};

export default lambda;
