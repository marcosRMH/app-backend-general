import * as path from 'path';
import * as fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnApi, CfnStage, CfnRoute, CfnIntegration } from 'aws-cdk-lib/aws-apigatewayv2';

export class AppBackendGeneralStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const generalHandler = new NodejsFunction(this, 'GeneralHandler', {
      entry: path.join(__dirname, '..', '..', 'src', 'infrastructure', 'lambda', 'handler.ts'),
      runtime: Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_TABLE: 'Items',
      },
      bundling: {
        target: 'node22',
        sourceMap: true,
        preCompilation: false,
        tsconfig: path.join(__dirname, '..', '..', 'tsconfig.json'),
        externalModules: ['@nestjs/microservices', '@nestjs/websockets'],
      },
    });

    const portfolioHandler = new NodejsFunction(this, 'PortfolioHandler', {
      entry: path.join(__dirname, '..', '..', 'src', 'infrastructure', 'lambda', 'handler.portfolio.ts'),
      runtime: Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
      },
      bundling: {
        target: 'node22',
        sourceMap: true,
        preCompilation: false,
        tsconfig: path.join(__dirname, '..', '..', 'tsconfig.json'),
        externalModules: ['@nestjs/microservices', '@nestjs/websockets'],
      },
    });

    const specPath = path.join(__dirname, '..', 'openapi.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

    const api = new CfnApi(this, 'AppApi', {
      name: 'app-backend-general',
      protocolType: 'HTTP',
      corsConfiguration: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['*'],
      },
    });

    new CfnStage(this, 'DefaultStage', {
      apiId: api.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    const seenInts = new Map<string, CfnIntegration>();

    for (const [pathExpr, methods] of Object.entries(spec.paths)) {
      for (const [httpMethod] of Object.entries(methods as Record<string, any>)) {
        let handler;

        if (pathExpr.startsWith('/portfolio')) {
          handler = portfolioHandler;
        } else {
          handler = generalHandler;
        }

        const intKey = handler.node.id;

        if (!seenInts.has(intKey)) {
          seenInts.set(intKey, new CfnIntegration(this, `${intKey}Integration`, {
            apiId: api.ref,
            integrationType: 'AWS_PROXY',
            integrationUri: cdk.Fn.sub(
              'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${funcArn}/invocations',
              { funcArn: handler.functionArn },
            ),
            payloadFormatVersion: '2.0',
          }));
        }

        const integration = seenInts.get(intKey)!;

        const routeId = `Route${pathExpr.replace(/[\/{}:]/g, '_')}_${httpMethod}`;
        new CfnRoute(this, routeId, {
          apiId: api.ref,
          routeKey: `${httpMethod.toUpperCase()} ${pathExpr}`,
          target: `integrations/${integration.ref}`,
        });
      }
    }

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: cdk.Fn.sub('https://${api}.execute-api.${AWS::Region}.amazonaws.com', { api: api.ref }),
    });

    new cdk.CfnOutput(this, 'GeneralLambda', {
      value: generalHandler.functionName,
    });

    new cdk.CfnOutput(this, 'PortfolioLambda', {
      value: portfolioHandler.functionName,
    });
  }
}
