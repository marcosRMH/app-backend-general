#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppBackendGeneralStack } from '../lib/app-backend-general-stack';

const app = new cdk.App();
new AppBackendGeneralStack(app, 'AppBackendGeneralStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
