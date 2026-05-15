# App Backend General

NestJS backend con arquitectura hexagonal, preparado para desplegar en AWS Lambda mediante CDK.

## Arquitectura Hexagonal

```
src/
├── domain/                     # Nucleo del negocio (independiente de frameworks)
│   ├── entities/               # Entidades de dominio (BaseEntity)
│   ├── value-objects/          # Value objects inmutables
│   ├── repositories/           # Puertos de salida (interfaces: BaseRepository)
│   └── services/               # Servicios de dominio
├── application/                # Orquestacion de la logica de negocio
│   ├── services/               # Application services (AppService, PortfolioService)
│   ├── dto/                    # Data Transfer Objects (PortfolioSendMessageDto, ResponseDto)
│   ├── mappers/                # Mapeadores entre capas (ResponseMapper)
│   └── ports/                  # Puertos inbound/outbound
│       ├── inbound/
│       └── outbound/
└── infrastructure/             # Adaptadores externos (frameworks, DB, AWS, etc.)
    ├── controllers/            # REST controllers (AppController, PortfolioController)
    ├── persistence/            # Implementacion de repositorios (DynamoDB)
    │   └── dynamodb/           # Adaptadores DynamoDB (ConfigRepositoryDynamoDb)
    ├── config/                 # Configuracion (env, etc.)
    ├── modules/                # Modulos NestJS (AppModule)
    └── lambda/                 # Handlers para AWS Lambda (handler.ts, handler.portfolio.ts)
```