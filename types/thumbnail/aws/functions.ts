import { AWS } from '@serverless/typescript';

type DeploymentSettings = {
  deploymentSettings?: {
    type: string;
    alias: string;
    alarms: string[];
  };
};
type LambdaAtEdge = {
  lambdaAtEdge?: {
    distribution: string;
    eventType: string;
    pathPattern: string;
  }[];
};

export type FunctionHandler = AWS['functions'][0] &
  DeploymentSettings &
  LambdaAtEdge;
