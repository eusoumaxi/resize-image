/* eslint-disable no-template-curly-in-string */
import type { AWS } from '@serverless/typescript';

import {
  thumbnail,
  generator,
  getThumbnail,
  generateSize,
} from './src/functions';
import { resizeSize } from './src/utils/size';

const serverlessConfiguration: AWS = {
  service: 'thumbnail-generator',
  frameworkVersion: '2',
  useDotenv: true,
  plugins: [
    'serverless-webpack',
    'serverless-offline',
    'serverless-stage-manager',
    'serverless-prune-plugin',
    'serverless-plugin-aws-alerts',
    'serverless-plugin-canary-deployments',
  ],

  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
      packager: 'npm',
    },
    stages: ['staging', 'production'],
    prune: {
      automatic: true,
      number: 3,
    },
    s3BucketProcess:
      'process-${self:service}-${self:provider.environment.NODE_ENV}',
    s3BucketOK: 'ok-${self:service}-${self:provider.environment.NODE_ENV}',
    alerts: {
      dashboards: true,
      definitions: {
        '5XXErrors': {
          name: '5XXErrors',
          namespace: 'AWS/ApiGateway',
          metric: '5XXError',
          omitDefaultDimension: true,
          dimensions: [
            {
              Name: 'ApiName',
              Value: '${self:service}-${self:provider.environment.NODE_ENV}',
            },
            {
              Name: 'Stage',
              Value: '${self:provider.environment.NODE_ENV}',
            },
          ],
          threshold: 5,
          statistic: 'Sum',
          period: 60,
          evaluationPeriods: 1,
          datapointsToAlarm: 1,
          comparisonOperator: 'GreaterThanOrEqualToThreshold',
        },
      },
      alarms: ['functionThrottles', 'functionErrors', '5XXErrors'],
    },
    getUrlCloudFront: {
      'Fn::Join': [
        '',
        ['https://', { 'Fn::GetAtt': ['CfDistribution', 'DomainName'] }],
      ],
    },
  },
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    iamRoleStatements: [
      {
        Effect: 'Allow',
        Action: ['codedeploy:*'],
        Resource: '*',
      },
      {
        Effect: 'Allow',
        Action: [
          's3:PutObject',
          's3:GetObject',
          's3:ListBucket',
          's3:DeleteObject',
        ],
        Resource: [
          'arn:aws:s3:::${self:custom.s3BucketProcess}/*',
          'arn:aws:s3:::${self:custom.s3BucketOK}/*',
        ],
      },
    ],
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      metrics: false,
      binaryMediaTypes: [
        '*/*',
        'image/*',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
      ],
    },
    logs: {
      restApi: {
        accessLogging: false,
        executionLogging: false,
        level: 'INFO',
        fullExecutionData: false,
      },
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      S3_BUCKET_PROCESS: '${self:custom.s3BucketProcess}',
      S3_BUCKET_OK: '${self:custom.s3BucketOK}',
      NODE_ENV: "${opt:stage,'dev'}",
      DOMAIN: '${self:custom.getUrlCloudFront}',
    },
    lambdaHashingVersion: '20201221',
  },
  resources: {
    Resources: {
      BucketProcess: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.S3_BUCKET_PROCESS}',
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        },
      },
      BucketOK: {
        Type: 'AWS::S3::Bucket',
        Properties: {
          BucketName: '${self:provider.environment.S3_BUCKET_OK}',
          AccessControl: 'PublicRead',
        },
      },
      BucketOKBucketPolicy: {
        Type: 'AWS::S3::BucketPolicy',
        Properties: {
          Bucket: {
            Ref: 'BucketOK',
          },
          PolicyDocument: {
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject'],
                Resource:
                  'arn:aws:s3:::${self:provider.environment.S3_BUCKET_OK}/*',
              },
            ],
          },
        },
      },
      CfOriginAccessIdentity: {
        Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
        Properties: {
          CloudFrontOriginAccessIdentityConfig: {
            Comment: 'image-resize-OAI',
          },
        },
      },
      CfDistribution: {
        Type: 'AWS::CloudFront::Distribution',
        Properties: {
          DistributionConfig: {
            Enabled: 'true',
            DefaultCacheBehavior: {
              AllowedMethods: [
                'GET',
                'HEAD',
                'OPTIONS',
                'PUT',
                'POST',
                'PATCH',
                'DELETE',
              ],
              MinTTL: '0',
              MaxTTL: '0',
              DefaultTTL: '0',
              TargetOriginId: 'thumbnailAPI',
              ForwardedValues: {
                QueryString: 'true',
                Cookies: {
                  Forward: 'all',
                },
              },
              ViewerProtocolPolicy: 'redirect-to-https',
            },
            CacheBehaviors: [
              {
                Compress: true,
                AllowedMethods: ['GET', 'HEAD'],
                TargetOriginId: 'S3OriginBucketOk',
                ForwardedValues: {
                  QueryString: 'false',
                },
                ViewerProtocolPolicy: 'https-only',
                PathPattern: `resize/original/*`,
              },
              ...resizeSize.map((key) => ({
                Compress: true,
                AllowedMethods: ['GET', 'HEAD'],
                TargetOriginId: 'S3OriginBucketOk',
                ForwardedValues: {
                  QueryString: 'false',
                },
                ViewerProtocolPolicy: 'https-only',
                PathPattern: `resize/${key[0]}/${key[1]}/*`,
              })),
            ],

            Origins: [
              {
                DomainName: {
                  'Fn::Join': [
                    '',
                    [
                      {
                        Ref: 'ApiGatewayRestApi',
                      },
                      '.execute-api.${self:provider.region}.amazonaws.com',
                    ],
                  ],
                },
                Id: 'thumbnailAPI',
                OriginPath: '/${self:provider.environment.NODE_ENV}',
                CustomOriginConfig: {
                  OriginProtocolPolicy: 'https-only',
                },
              },
              {
                DomainName:
                  '${self:provider.environment.S3_BUCKET_OK}.s3.amazonaws.com',
                Id: 'S3OriginBucketOk',
                S3OriginConfig: {
                  OriginAccessIdentity: {
                    'Fn::Sub':
                      'origin-access-identity/cloudfront/${CfOriginAccessIdentity}',
                  },
                },
              },
            ],
          },
        },
      },
    },
  },
  functions: { thumbnail, generator, getThumbnail, generateSize },
};

module.exports = serverlessConfiguration;
