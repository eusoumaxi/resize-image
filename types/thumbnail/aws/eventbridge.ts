interface UserIdentity {
  principalId: string;
}

interface RequestParameters {
  sourceIPAddress: string;
}

interface ResponseElements {
  [Key: string]: string;
}

interface OwnerIdentity {
  principalId: string;
}

interface Bucket {
  name: string;
  ownerIdentity: OwnerIdentity;
  arn: string;
}

interface Object {
  key: string;
  size: number;
  eTag: string;
  sequencer: string;
}

interface S3 {
  s3SchemaVersion: string;
  configurationId: string;
  bucket: Bucket;
  object: Object;
}

interface Record {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: Date;
  eventName: string;
  userIdentity: UserIdentity;
  requestParameters: RequestParameters;
  responseElements: ResponseElements;
  s3: S3;
}

export type EventS3Put = {
  Records: Record[];
};
