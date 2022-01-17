import { AWS } from '@serverless/typescript';
import { FunctionHandler } from './functions';

type Function = {
  [k: string]: FunctionHandler;
};
type FunctionsServerless = {
  functions: AWS['functions'] | Function;
};
export type AWSServerless = AWS & FunctionsServerless;
