import { FunctionHandler } from 'thumbnail/types/aws/functions';

const lambda: FunctionHandler = {
  handler: `${__dirname.split(process.cwd())[1].substring(1)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'thumbnail/{id}',
      },
    },
  ],
};

export default lambda;
