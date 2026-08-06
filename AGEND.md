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
| `handler.admin-users.ts` | `UserModule` | `AdminApi` (propio) | CRUD usuarios, roles, permisos |
| `handler.portfolio.ts` | `PortfolioModule` | `AppApi` (general) | Lógica de portfolio (envío de mensajes, multilanguage) |
| `handler.ts` (general) | `AppModule` | `AppApi` (general) | Health check, rutas generales |

### Endpoints

#### Auth (AuthModule)

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/auth/login` | Login con email/password → tokens JWT | No |
| `POST` | `/auth/refresh` | Refresh token → nuevos tokens | Refresh Token |
| `POST` | `/auth/logout` | Invalida sesión | Access Token |

#### User Management (UserModule) — AdminApi

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `POST` | `/user` | Crear usuario en Cognito | Bearer + `x-id-token` |
| `GET` | `/user` | Listar usuarios | Bearer + `x-id-token` |
| `GET` | `/user/:id` | Obtener usuario por ID | Bearer + `x-id-token` |
| `PUT` | `/user/:id` | Actualizar perfil de usuario | Bearer + `x-id-token` |
| `PUT` | `/user/:id/role` | Asignar/modificar rol | Bearer + `x-id-token` |
| `POST` | `/user/:id/reset-password` | Resetear contraseña | Bearer + `x-id-token` |

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

## Tokens (JWT)

El `POST /auth/login` devuelve tres tokens firmados por Cognito (RS256). La firma se valida contra el **JWKS público del User Pool**, accesible en:

```
https://cognito-idp.<region>.amazonaws.com/<userPoolId>/.well-known/jwks.json
```

Por ser llaves públicas, **cualquier servicio en cualquier cuenta AWS** puede verificar la firma (solo necesita `userPoolId` y `clientId`), sin trust de IAM entre cuentas.

| Token | `token_use` | Contiene | Uso |
|-------|-------------|----------|-----|
| `accessToken` | `access` | `sub`, `username`, `cognito:groups`, `exp`, ... | Autenticar APIs (Bearer). **No** incluye custom attributes |
| `idToken` | `id` | `sub`, `email`, `cognito:groups`, **custom attributes (`custom:*`)** | Identidad/rol del usuario |
| `refreshToken` | — | Opaque | Renovar tokens en `/auth/refresh` |

### Regla clave: dónde vive el rol

- **`custom:role`** (custom attribute) → viaja **solo en el ID token**. Cognito no lo incluye en el access token.
- **`cognito:groups`** → viaja en el access token **y** en el ID token.
- El rol lo asigna Cognito al usuario (al crearlo/actualizarlo); **el front nunca lo envía por separado**, solo viaja dentro del token.

---

## Seguridad de las APIs

### Guards

| Guard | Qué hace |
|-------|----------|
| `AuthGuard` | Valida firma + expiración de los tokens contra el JWKS de Cognito (vía `aws-jwt-verify`). Adjunta el payload verificado en `request.user` |
| `RoleGuard` | Exige que `request.user['custom:role']` exista y **no esté vacío** |
| `RecaptchaGuard` | Valida token reCAPTCHA (portfolio) |

### Requisitos por API

| API | Rutas | Auth requerida |
|-----|-------|----------------|
| `IdentityApi` | `/auth/login` | Sin auth |
| `IdentityApi` | `/auth/refresh` | Refresh token (body) |
| `IdentityApi` | `/auth/logout` | Bearer access token |
| `AdminApi` | `/user/*` | **Bearer access token + header `x-id-token`** |
| `AppApi` | `/portfolio/*` | reCAPTCHA / header `x-name-portal` |
| `AppApi` | `/health` | Sin auth |

### AdminApi (`/user/*`) — ambos tokens obligatorios

```
Authorization: Bearer <accessToken>
x-id-token: <idToken>
```

El `AuthGuard` en `/user/*`:
1. Valida el **access token** (Bearer) contra el JWKS (`tokenUse: 'access'`).
2. Valida el **ID token** del header `x-id-token` (`tokenUse: 'id'`).
3. Verifica que ambos tokens pertenezcan al **mismo usuario** (`sub` idéntico). Si no → `401`.
4. Pone el payload del **ID token** en `request.user` (de ahí sale el rol).

Errores posibles:

| Caso | Respuesta |
|------|-----------|
| Falta Bearer | `401 Token de autorización requerido` |
| Falta `x-id-token` | `401 ID token requerido en el header x-id-token` |
| Tokens de distintos usuarios | `401 Los tokens no pertenecen al mismo usuario` |
| Tokens inválidos/expirados | `401 Token inválido o expirado` |
| `custom:role` vacío o ausente | `403 El token debe contener un rol no vacío` |

> La verificación de firma es portable a otras cuentas; el rol es política **local** de cada API consumidora.

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
- [x] Integrar AuthService con AWS Cognito (initiateAuth, refreshToken, globalSignOut)
- [x] Crear handler.admin-users.ts Lambda handler (ADMIN_USERS) con AdminApi propio
- [x] Implementar AuthGuard (firma JWKS, access + id token) y RoleGuard (rol no vacío)
- [x] Agregar AdminUsersHandler al CDK con API Gateway propio (AdminApi)
- [x] Generar openapi.json con los nuevos endpoints
- [ ] Crear Cognito User Pool + Client en CDK
- [ ] Implementar UserModule (CRUD usuarios reales con Cognito)
- [ ] Adaptar PortfolioModule al nuevo esquema
- [ ] Tests unitarios y e2e
