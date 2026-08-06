import * as path from 'path';
import * as fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, CfnPermission } from 'aws-cdk-lib/aws-lambda';
import { CfnApi, CfnStage, CfnRoute, CfnIntegration } from 'aws-cdk-lib/aws-apigatewayv2';

export class AppBackendGeneralStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const projectRoot = path.join(__dirname, '..', '..');

    const bundlingConfig = {
      target: 'node22' as const,
      sourceMap: true,
      preCompilation: false,
      tsconfig: path.join(projectRoot, 'tsconfig.json'),
      externalModules: ['@nestjs/microservices', '@nestjs/websockets', 'class-transformer'],
      commandHooks: {
        afterBundling: (_inputDir: string, outputDir: string) => [
          `xcopy /E /I "${projectRoot}\\node_modules\\class-transformer" "${outputDir}\\node_modules\\class-transformer\\"`,
        ],
        beforeInstall: () => [],
        beforeBundling: () => [],
      },
    };

    const generalHandler = new NodejsFunction(this, 'GeneralHandler', {
      entry: path.join(projectRoot, 'src', 'infrastructure', 'lambda', 'handler.ts'),
      projectRoot,
      runtime: Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_TABLE: 'Items',
      },
      bundling: bundlingConfig,
    });

    const portfolioHandler = new NodejsFunction(this, 'PortfolioHandler', {
      functionName: 'APPBACKENDPORTFOLIOV1',
      entry: path.join(projectRoot, 'src', 'infrastructure', 'lambda', 'handler.portfolio.ts'),
      projectRoot,
      runtime: Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
        RECAPTCHA_SECRET_KEY: process.env.RECAPTCHA_SECRET_KEY || '',
        TABLE_CONFIG: process.env.TABLE_CONFIG || 'CONFIG_PORTALS',
        ARN_SNS: process.env.ARN_SNS || 'arn:aws:sns:us-east-1:632320832385:notiicationPortfolioMRMH'
      },
      bundling: bundlingConfig,
    });

    const identityLoginHandler = new NodejsFunction(this, 'IdentityLoginHandler', {
      functionName: 'IDENTITY_LOGIN',
      entry: path.join(projectRoot, 'src', 'infrastructure', 'lambda', 'handler.identity-login.ts'),
      projectRoot,
      runtime: Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
        COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
      },
      bundling: bundlingConfig,
    });

    const adminUsersHandler = new NodejsFunction(this, 'AdminUsersHandler', {
      functionName: 'ADMIN_USERS',
      entry: path.join(projectRoot, 'src', 'infrastructure', 'lambda', 'handler.admin-users.ts'),
      projectRoot,
      runtime: Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(29),
      environment: {
        NODE_ENV: 'production',
        COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID || '',
        COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID || '',
      },
      bundling: bundlingConfig,
    });

    const specPath = path.join(__dirname, '..', 'openapi.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));

    const corsConfig = {
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['*'],
    };

    const api = new CfnApi(this, 'AppApi', {
      name: 'app-backend-general',
      protocolType: 'HTTP',
      corsConfiguration: corsConfig,
    });

    new CfnStage(this, 'DefaultStage', {
      apiId: api.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    const identityApi = new CfnApi(this, 'IdentityApi', {
      name: 'identity-login',
      protocolType: 'HTTP',
      corsConfiguration: corsConfig,
    });

    new CfnStage(this, 'IdentityStage', {
      apiId: identityApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    const adminApi = new CfnApi(this, 'AdminApi', {
      name: 'admin-users',
      protocolType: 'HTTP',
      corsConfiguration: corsConfig,
    });

    new CfnStage(this, 'AdminStage', {
      apiId: adminApi.ref,
      stageName: '$default',
      autoDeploy: true,
    });

    const seenInts = new Map<string, CfnIntegration>();
    const identitySeenInts = new Map<string, CfnIntegration>();
    const adminSeenInts = new Map<string, CfnIntegration>();

    for (const [pathExpr, methods] of Object.entries(spec.paths)) {
      for (const [httpMethod] of Object.entries(methods as Record<string, any>)) {
        const isAuth = pathExpr.startsWith('/auth');
        const isUser = pathExpr.startsWith('/user');

        if (isAuth) {
          const intKey = identityLoginHandler.node.id;

          if (!identitySeenInts.has(intKey)) {
            identitySeenInts.set(intKey, new CfnIntegration(this, `Identity${intKey}Integration`, {
              apiId: identityApi.ref,
              integrationType: 'AWS_PROXY',
              integrationUri: cdk.Fn.sub(
                'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${funcArn}/invocations',
                { funcArn: identityLoginHandler.functionArn },
              ),
              payloadFormatVersion: '2.0',
            }));
          }

          const integration = identitySeenInts.get(intKey)!;
          const routeId = `IdentityRoute${pathExpr.replace(/[\/{}:]/g, '_')}_${httpMethod}`;
          new CfnRoute(this, routeId, {
            apiId: identityApi.ref,
            routeKey: `${httpMethod.toUpperCase()} ${pathExpr}`,
            target: `integrations/${integration.ref}`,
          });
        } else if (isUser) {
          const intKey = adminUsersHandler.node.id;

          if (!adminSeenInts.has(intKey)) {
            adminSeenInts.set(intKey, new CfnIntegration(this, `Admin${intKey}Integration`, {
              apiId: adminApi.ref,
              integrationType: 'AWS_PROXY',
              integrationUri: cdk.Fn.sub(
                'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${funcArn}/invocations',
                { funcArn: adminUsersHandler.functionArn },
              ),
              payloadFormatVersion: '2.0',
            }));
          }

          const integration = adminSeenInts.get(intKey)!;
          const routeId = `AdminRoute${pathExpr.replace(/[\/{}:]/g, '_')}_${httpMethod}`;
          new CfnRoute(this, routeId, {
            apiId: adminApi.ref,
            routeKey: `${httpMethod.toUpperCase()} ${pathExpr}`,
            target: `integrations/${integration.ref}`,
          });
        } else {
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
    }

    new CfnPermission(this, 'GeneralHandlerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: generalHandler.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: cdk.Fn.sub('arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${apiId}/*', { apiId: api.ref }),
    });

    new CfnPermission(this, 'PortfolioHandlerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: portfolioHandler.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: cdk.Fn.sub('arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${apiId}/*', { apiId: api.ref }),
    });

    new CfnPermission(this, 'IdentityLoginHandlerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: identityLoginHandler.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: cdk.Fn.sub('arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${apiId}/*', { apiId: identityApi.ref }),
    });

    new CfnPermission(this, 'AdminUsersHandlerPermission', {
      action: 'lambda:InvokeFunction',
      functionName: adminUsersHandler.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: cdk.Fn.sub('arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${apiId}/*', { apiId: adminApi.ref }),
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: cdk.Fn.sub('https://${api}.execute-api.${AWS::Region}.amazonaws.com', { api: api.ref }),
    });

    new cdk.CfnOutput(this, 'IdentityApiUrl', {
      value: cdk.Fn.sub('https://${api}.execute-api.${AWS::Region}.amazonaws.com', { api: identityApi.ref }),
    });

    new cdk.CfnOutput(this, 'AdminApiUrl', {
      value: cdk.Fn.sub('https://${api}.execute-api.${AWS::Region}.amazonaws.com', { api: adminApi.ref }),
    });

    new cdk.CfnOutput(this, 'GeneralLambda', {
      value: generalHandler.functionName,
    });

    new cdk.CfnOutput(this, 'PortfolioLambda', {
      value: portfolioHandler.functionName,
    });

    new cdk.CfnOutput(this, 'IdentityLoginLambda', {
      value: identityLoginHandler.functionName,
    });

    new cdk.CfnOutput(this, 'AdminUsersLambda', {
      value: adminUsersHandler.functionName,
    });
  }
}
