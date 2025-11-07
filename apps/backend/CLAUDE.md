# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS backend application for an online course management system. Built with TypeScript, PostgreSQL, and TypeORM. The system manages authentication, users, courses, lessons, payments, and user scheduling.

## Commands

### Development
```bash
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger
npm run build             # Build for production
npm run start:prod        # Run production build
npm run console           # CLI interface for database operations
```

### Testing
```bash
# Basic test commands
npm run test:parallel          # Run tests with 4 workers (faster)
npm run test:sequential        # Run tests in single process (more stable)
npm run test:parallel:random   # Parallel with randomized order
npm run test:sequential:random # Sequential with randomized order

# Advanced test runner script
./run-tests.sh [OPTIONS]       # Flexible test runner with options:
  -o                           # Offline mode (skip integration tests)
  -m MODE                      # parallel or sequential
  -r                           # Randomize test order
  -s                           # Show Allure report after tests
  -t PATH                      # Run specific test file/folder

# Examples
./run-tests.sh -s                                    # Parallel with report
./run-tests.sh -o -m sequential                      # Sequential, offline
./run-tests.sh -t src/modules/auth/tests -m sequential -s

# Run single test file
npm run test:parallel -- auth.service.spec.ts
npm run test:parallel -- src/modules/auth           # Entire module
npm run test:parallel -- --testNamePattern="login"  # By pattern

# Test utilities
npm run test:watch        # Watch mode
npm run test:cov          # With coverage
npm run test:debug        # Debug mode
```

### Allure Reports
```bash
npm run allure:show       # Open existing report
npm run allure:append     # Generate report from results
npm run allure:prepare    # Prepare history before test run
npm run allure:clean      # Clear all results and reports
```

### Database & Scripts
```bash
npm run pg:update-function       # Update PostgreSQL functions (development)
npm run pg:update-test-function  # Update PostgreSQL functions (test DB)
./scripts/check-parallelization.sh  # Analyze test parallelization settings
```

### Linting & Formatting
```bash
npm run lint              # ESLint with auto-fix
npm run format            # Prettier formatting
```

## Architecture

### Module Structure
Each module follows a consistent pattern:
- **Controller** - HTTP endpoints and request/response handling
- **Service** - Business logic implementation
- **Repository** - Data access layer with interface (`IXxxRepo`)
- **Entity** - TypeORM database entities
- **Domain** - Domain models (separated from DB entities)
- **Mapper** - Converts between entities and domain objects
- **DTOs** - Request/response data transfer objects in `dto/` folder
- **Tests** - Co-located in `tests/` folder within each module

### Key Modules
- `auth/` - JWT authentication (login, register, token management)
- `users/` - User management and profiles
- `courses/` - Course CRUD operations
- `lessons/` - Lesson management
- `payments/` - Payment processing
- `course-enrollments/` - Student enrollments
- `user-availability/` - Teacher availability tracking
- `user-schedule/` - Scheduling system

### Shared Code
- `src/common/services/` - `TokenService` (JWT), `HashService` (bcrypt)
- `src/common/errors/` - Custom error classes (`RepositoryNotFoundError`, etc.)
- `src/common/logging/` - `LogService`, `ErrorLoggerInterceptor`
- `src/common/tests/builders/` - Test data builders for entities
- `src/common/tests/object-mothers/` - Predefined test data factories

### Dependency Injection Pattern
Services and repositories are injected using interfaces:
```typescript
constructor(
  @Inject('IUserRepo') private readonly userRepository: IUserRepo,
  @Inject('IHashService') private readonly hashService: IHashService,
)
```

### Database Layer
- TypeORM with PostgreSQL (production) and SQLite (tests)
- Each integration test creates an isolated database schema
- Custom repository errors: `RepositoryNotFoundError`, `RepositoryUnknownError`, `RepositoryDuplicateError`, `RepositoryForbiddenError`
- Repositories implement `findOrFailById()` pattern that throws on missing entities

### Authentication
- JWT-based with access and refresh tokens
- Guards: `AuthGuard` (required auth), `OptionalAuthGuard` (optional auth)
- Token payload: `{ id, email, role }`
- Tokens created via `TokenService.create(body, secret, expiresIn)`

### Global Configuration
- Environment variables loaded via `@nestjs/config` (global)
- Global API prefix: `/api`
- Global validation pipe with whitelist and forbidNonWhitelisted
- Global error logging interceptor
- CORS enabled for `http://localhost:5173`

## Testing Strategy

### Test Organization
- **Unit tests**: Mock all dependencies (repository, services)
- **Integration tests**: Real PostgreSQL database with isolated schemas
- 35 test files total across all modules
- Tests use builders and object mothers from `src/common/tests/`

### Parallelization
- Jest parallelizes at the **file level only** (not within files)
- Default: 4 workers in parallel mode
- All tests in a single `.spec.ts` run sequentially in one process
- Use `--runInBand` for debugging or avoiding race conditions
- Randomization available via `jest.config.random.ts` with custom sequencer

### Offline Mode
- Set `IS_OFFLINE=true` to skip integration tests
- Useful for CI/CD or when database is unavailable
- Use `./run-tests.sh -o` to enable

### Test Data Patterns
- **Builders**: Flexible object construction (`new UserBuilder().withEmail('x').build()`)
- **Object Mothers**: Predefined scenarios (`UserObjectMother.createStudent()`)
- Located in `src/common/tests/builders/` and `src/common/tests/object-mothers/`

## Important Patterns

### Repository Interface Pattern
All repositories are accessed through interfaces (`IUserRepo`, `ICourseRepo`, etc.). When implementing new repositories:
1. Define interface with methods
2. Implement with TypeORM repository
3. Register with `{ provide: 'IUserRepo', useClass: UserRepo }` in module
4. Inject using `@Inject('IUserRepo')`

### Domain-Entity Separation
- **Entities** (`*.entity.ts`): TypeORM decorators, database mapping
- **Domains** (`*.domain.ts`): Pure TypeScript classes, business logic
- **Mappers** (`*.mapper.ts`): Convert entity ↔ domain with `toDomainEntity()` method

### Error Handling
- Repositories throw custom `RepositoryError` subclasses
- Services catch and rethrow as appropriate NestJS exceptions
- Global `ErrorLoggerInterceptor` logs all errors
- Use `ConfigService.getOrThrow()` for required env vars

## Configuration Notes

### Environment Variables (.env)
Required variables:
- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- `PORT` (default: 3000)

Test environment uses `.env.test` with separate database.

### Path Aliases
Configured in `tsconfig.json`:
- `src/*` → `./src/*`
- `@modules/*` → `./src/modules/*`

Jest mirrors these in `moduleNameMapper`.

## Workspace Context

This backend is part of a monorepo workspace (see `"@shared/types": "workspace:*"` dependency). Shared types are imported from a workspace package.
