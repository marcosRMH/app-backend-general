# AGEND - App Backend General

Backend central de **autenticación y gestión de usuarios** vía AWS Cognito para diversos portales.

Cada unidad de negocio (portfolio, etc.) mantiene su propio repo con su lógica y configuración. Este repo provee los servicios compartidos de identidad y acceso.

---

## Propósito

- **Login principal** → AWS Cognito (autenticación, tokens, sesiones)
- **Gestión de usuarios** → CRUD de usuarios, roles, permisos
- **Configuración de usuarios** → Atributos, roles por portal
- **NO contiene lógica de negocio** → Cada portal es otro repo

---

## Arquitectura

### Lambda Handlers

| Handler | Módulo | API Gateway | Responsabilidad |
|---------|--------|-------------|-----------------|
| `handler.identity-login.ts` | `AuthModule` | `IdentityApi` (propio) | Login, refresh tokens, logout |
| `handler.user.ts` | `UserModule` | `AppApi` (general) | CRUD usuarios, roles, permisos (superuser only) |
| `handler.portfolio.ts` | `PortfolioModule` | `AppApi` (general) | Lógica de portfolio (envío de mensajes, multilanguage) |
| `handler.ts` (general) | `AppModule` | `AppApi` (general) | Health check, rutas generales |

### Endpoints

#### Auth (AuthModule)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Login con email/password → tokens JWT | No |
| `POST` | `/auth/refresh` | Refresh token → nuevos tokens | Refresh Token |
| `POST` | `/auth/logout` | Invalida sesión | Access Token |

#### User Management (UserModule)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/users` | Crear usuario en Cognito | Superuser |
| `GET` | `/users` | Listar usuarios | Superuser |
| `GET` | `/users/:id` | Obtener usuario por ID | Superuser |
| `PUT` | `/users/:id` | Actualizar perfil de usuario | Superuser / Self |
| `PUT` | `/users/:id/role` | Asignar/modificar rol | Superuser |
| `POST` | `/users/:id/reset-password` | Resetear contraseña | Superuser |

#### Portfolio (PortfolioModule) — existente

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/portfolio/send-message` | Envía mensaje desde portal | reCAPTCHA |
| `GET` | `/portfolio/multilanguage/:type` | Config multilanguage por tipo | `x-name-portal` header |

#### General (AppModule)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Health check | No |

---

## Roles y Permisos

### Mecanismo: Custom Attributes de Cognito (sin costo adicional)

- Atributo: `custom:role`
- Valores: `"admin"` | `"user"`

### Acciones por rol

| Acción | Admin (superuser) | User |
|--------|-------------------|------|
| Login / Logout | ✅ | ✅ |
| Ver propio perfil | ✅ | ✅ |
| Actualizar propio perfil | ✅ | ✅ |
| Crear usuarios | ✅ | ❌ |
| Listar usuarios | ✅ | ❌ |
| Ver usuario cualquiera | ✅ | ❌ |
| Actualizar usuario cualquiera | ✅ | ❌ |
| Asignar roles | ✅ | ❌ |
| Resetear contraseñas | ✅ | ❌ |

---

## AWS Cognito (User Pool)

### Recursos CDK

| Construct | Descripción |
|-----------|-------------|
| `CfnUserPool` | User Pool con custom attribute `role` |
| `CfnUserPoolClient` | Client para la aplicación |

### Custom Attributes

| Atributo | Tipo | Descripción |
|----------|------|-------------|
| `custom:role` | String | Rol del usuario: `admin` o `user` |

### Costo

Cognito User Pool tiene **tier gratuito** generoso (50,000 MAU active). Custom attributes y groups no generan costo adicional.

---

## Estructura del Código

### Arquitectura Hexagonal

```
src/
├── domain/
│   ├── entities/
│   │   ├── base.entity.ts              # BaseEntity<TId> (existente)
│   │   ├── user.entity.ts              # User entity
│   │   └── index.ts
│   ├── repositories/
│   │   ├── base-repository.interface.ts # (existente)
│   │   ├── cognito.repository.ts       # CognitoRepository port
│   │   └── index.ts
│   ├── value-objects/
│   │   └── index.ts
│   └── services/
│       └── index.ts
│
├── application/
│   ├── services/
│   │   ├── app.service.ts              # Health check (existente)
│   │   ├── auth.service.ts             # Login, refresh, logout (TODO: Cognito)
│   │   ├── user.service.ts             # CRUD usuarios (pendiente)
│   │   └── recaptcha.service.ts        # (existente, portfolio)
│   ├── dto/
│   │   ├── response.dto.ts             # ResponseDto (existente)
│   │   ├── auth/
│   │   │   ├── login.dto.ts            # Email + password
│   │   │   ├── refresh-token.dto.ts    # Refresh token
│   │   │   ├── token-response.dto.ts   # Access/refresh token response
│   │   │   └── index.ts
│   │   ├── user/                       # (pendiente UserModule)
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── assign-role.dto.ts
│   │   └── portfolio/
│   │       ├── portfolio-send-message.dto.ts  # (existente)
│   │       └── x-name-portal.header.dto.ts    # (existente)
│   ├── mappers/
│   │   ├── response.mapper.ts          # (existente)
│   │   └── user.mapper.ts
│   ├── commons/
│   │   ├── sns-helper.util.ts          # (existente, portfolio)
│   │   └── send-email.util.ts          # (existente, portfolio)
│   └── ports/
│       └── index.ts
│
└── infrastructure/
    ├── controllers/
    │   ├── app.controller.ts           # (existente)
    │   ├── auth.controller.ts          # Login/refresh/logout (creado)
    │   ├── user.controller.ts          # CRUD usuarios (pendiente)
    │   └── portfolio.controller.ts     # (existente)
    ├── guards/
    │   ├── auth.guard.ts               # Valida JWT de Cognito
    │   ├── role.guard.ts               # Valida custom:role
    │   └── recaptcha.guard.ts          # (existente, portfolio)
    ├── persistence/
    │   └── cognito/
    │       └── cognito.adapter.ts      # Implementación CognitoRepository
    ├── config/
    │   ├── env.config.ts               # (existente)
    │   └── cognito.config.ts           # User Pool ID, Client ID
    ├── modules/
    │   ├── app.module.ts               # (existente)
    │   ├── auth.module.ts              # AuthModule (creado)
    │   ├── user.module.ts              # UserModule (pendiente)
    │   └── portfolio.module.ts         # (existente)
    └── lambda/
        ├── handler.ts                  # General handler (existente)
        ├── handler.identity-login.ts   # Identity Login Lambda (AuthModule)
        ├── handler.portfolio.ts        # (existente)
        ├── handler.d.ts                # (existente)
        └── index.ts                    # Barrel exports
```

---

## CDK (Infrastructure)

### Stack: `AppBackendGeneralStack`

#### Lambda Functions

| Construct | Function Name | Entry | Módulo | API Gateway |
|-----------|--------------|-------|--------|-------------|
| `GeneralHandler` | (auto) | `handler.ts` | `AppModule` | `AppApi` |
| `PortfolioHandler` | `APPBACKENDPORTFOLIOV1` | `handler.portfolio.ts` | `PortfolioModule` | `AppApi` |
| `IdentityLoginHandler` | `IDENTITY_LOGIN` | `handler.identity-login.ts` | `AuthModule` | `IdentityApi` |

#### Cognito Resources

| Construct | Tipo | Descripción |
|-----------|------|-------------|
| `UserPool` | `CfnUserPool` | Pool de usuarios con custom attribute `role` |
| `UserPoolClient` | `CfnUserPoolClient` | Client para la app |

#### API Gateway HTTP API

**AppApi** (general):
- Rutas dinámicas desde `openapi.json` (excluye `/auth/*`)
- `/portfolio/*` → PortfolioHandler
- `/*` (default) → GeneralHandler

**IdentityApi** (login):
- Rutas `/auth/*` desde `openapi.json`
- `IdentityLoginHandler`

---

## Reglas de Separación

### Este repo SÍ hace:
- Autenticación (login, tokens, sesiones)
- Gestión de usuarios (CRUD, roles, permisos)
- Control de acceso (quién puede hacer qué)
- Health check general

### Este repo NO hace:
- Lógica de negocio de ningún portal
- Configuración de portales (multilanguage, themes, etc.)
- Email sending, notificaciones específicas de portales
- Procesamiento de datos de negocio

### Cada repo de portal hace:
- Lógica de negocio específica
- Configuración propia (DynamoDB, etc.)
- Puede verificar JWT de Cognito directamente o delegar a este backend

---

## Pendiente (No implementar aún)

- [x] Crear AuthModule con AuthController y AuthService
- [x] Crear handler.identity-login.ts Lambda handler
- [x] Agregar IdentityLoginHandler al CDK con API Gateway propio
- [x] Actualizar script generate-openapi.ts para incluir AuthModule
- [ ] Integrar AuthService con AWS Cognito (initiateAuth, refreshToken, globalSignOut)
- [ ] Crear Cognito User Pool + Client en CDK
- [ ] Implementar UserModule (CRUD usuarios)
- [ ] Implementar AuthGuard y RoleGuard
- [ ] Adaptar PortfolioModule al nuevo esquema
- [ ] Generar openapi.json con los nuevos endpoints
- [ ] Tests unitarios y e2e
