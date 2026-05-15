# CDK - App Backend General

Despliegue del backend NestJS en AWS Lambda usando AWS CDK.

## Stack

| Recurso | Descripcion |
|---------|-------------|
| `GeneralHandler` (Lambda) | NestJS con AppModule - health + items CRUD |
| `OrdersHandler` (Lambda) | NestJS con OrdersModule - orders CRUD |
| API Gateway HTTP API | Rutas creadas desde `openapi.json` (generado por NestJS Swagger) |
| CloudWatch Logs | Logs automaticos de cada Lambda |

## Requisitos

- Node.js 22+
- AWS CLI configurado (`aws configure`)
- CDK bootstrap ejecutado en la cuenta

## Comandos

Los comandos `npm run deploy` y `npm run synth` ejecutan automaticamente `generate:openapi` antes de ejecutar CDK.

```bash
# Deploy completo (genera openapi.json + despliega)
npm run deploy

# Solo sintetizar template
npm run synth

# Desplegar solo una Lambda especifica
npx cdk deploy GeneralHandler
npx cdk deploy OrdersHandler

# Ver diferencias contra el stack desplegado
npx cdk diff

# Destruir todo
npx cdk destroy

# Destruir solo una Lambda
npx cdk destroy GeneralHandler
```

### Flujo manual paso a paso

```bash
# 1. Generar openapi.json desde los decoradores NestJS
cd ..
npm run generate:openapi
cd cdk

# 2. Instalar dependencias (solo primera vez)
npm install

# 3. Primera vez: bootstrap CDK
npx cdk bootstrap

# 4. Desplegar
npx cdk deploy
```

## Variables de entorno para el stack CDK

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `CDK_DEFAULT_ACCOUNT` | Cuenta AWS CLI | Account ID |
| `CDK_DEFAULT_REGION` | Region AWS CLI | Region de AWS |

Se setean automaticamente si AWS CLI esta configurado.

## Variables de entorno para las Lambdas

### GeneralHandler (`/health`, `/items`)

Definidas en `GeneralHandler` dentro del stack:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `DYNAMODB_TABLE` | `Items` |

### OrdersHandler (`/orders`)

Definidas en `OrdersHandler` dentro del stack:

| Variable | Valor |
|----------|-------|
| `NODE_ENV` | `production` |
| `ORDERS_TABLE` | `Orders` |

## Endpoints tras deploy

```bash
# La URL del API Gateway se muestra al final como "ApiUrl"
curl https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/health
curl https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/items
curl https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/orders
```

## Notas

- Cada Lambda usa `NodejsFunction` de CDK, que bundlea automaticamente con esbuild.
- No requiere build manual previo ni Docker.
- Las tablas DynamoDB no se crean en este stack. Deben existir previamente.
- Las Lambdas comparten el mismo API Gateway pero atienden rutas diferentes.
- Para agregar una nueva Lambda: crear entidades/repositorios en `domain/`, servicios/DTOs en `application/`, y controlador/modulo/handler en `infrastructure/`, luego registrar en el stack.
- El API Gateway se construye desde `openapi.json`, generado con `npm run generate:openapi`.
- `openapi.json` esta en `.gitignore`. Los comandos `npm run deploy` y `npm run synth` lo generan automaticamente.

npx cdk deploy --hotswap --require-approval never
