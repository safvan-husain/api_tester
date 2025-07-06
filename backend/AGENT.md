# AGENT.md - NestJS Project Best Practices

This document outlines the best practices, coding style, and testing guidelines for the NestJS project using Typegoose as the database ORM.

## Table of Contents
- [Project Structure](#project-structure)
- [Coding Style](#coding-style)
- [Database with Typegoose](#database-with-typegoose)
- [API Development](#api-development)
- [Testing Guidelines](#testing-guidelines)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Version Control](#version-control)
- [Code Review](#code-review)

## Project Structure
Adopt a modular structure to keep the codebase organized and maintainable:
```
src/
├── modules/
│   ├── module-name/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── module-name.controller.ts
│   │   ├── module-name.service.ts
│   │   ├── module-name.module.ts
│   │   └── module-name.spec.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   └── interfaces/
├── config/
└── main.ts
```

- Each module should be self-contained, handling a specific domain or feature.
- Use `common` for shared utilities, decorators, filters, and interfaces.
- Place configuration files in the `config` directory.

## Coding Style
- **Language**: Use TypeScript with strict mode enabled (`strict: true` in `tsconfig.json`).
- **Formatting**: Use Prettier with the following settings:
  - Single quotes
  - Trailing commas
  - 2-space indentation
  - Print width: 80
- **Linting**: Use ESLint with `@typescript-eslint` plugin for consistent code quality.
- **Naming Conventions**:
  - Use PascalCase for class names and interfaces (e.g., `UserService`, `IUser`).
  - Use camelCase for variables, methods, and functions (e.g., `getUserById`).
  - Use kebab-case for file names (e.g., `user.controller.ts`).
- **Imports**:
  - Organize imports in this order: Node.js built-ins, external libraries, internal modules.
  - Use absolute imports with `@` aliases (e.g., `@modules/user/user.service`).
- **Documentation**: Use JSDoc for public methods and classes. Document parameters, return types, and exceptions.

## Database with Typegoose
- Use **Typegoose** for MongoDB schema definitions and model management.
- Define models in the `entities` folder within each module.
- Example model definition:
```typescript
import { prop, getModelForClass } from '@typegoose/typegoose';

class User {
  @prop({ required: true })
  public name!: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true })
  public password!: string;
}

export const UserModel = getModelForClass(User);
```
- Use dependency injection to inject models into services.
- Avoid raw MongoDB queries; leverage Typegoose's type-safe methods.
- Ensure indexes are defined for frequently queried fields (e.g., `@prop({ index: true })`).

## API Development
- **RESTful Principles**: Follow REST conventions for endpoints (e.g., `GET /users`, `POST /users`).
- **DTOs**: Use Data Transfer Objects (DTOs) for request/response validation with `class-validator`.
  - Place DTOs in the `dto` folder within the module.
  - Example:
```typescript
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```
- **Versioning**: Use URI versioning (e.g., `/api/v1/users`).
- **Controllers**: Keep controllers thin; delegate business logic to services.
- **Services**: Encapsulate business logic in services, ensuring they are reusable and testable.

## Testing Guidelines
- **Mandatory Testing**: Write unit and integration tests for every feature and API endpoint.
- **Testing Framework**: Use Jest with `@nestjs/testing` for testing.
- **File Naming**: Place test files next to the source file with a `.spec.ts` suffix (e.g., `user.service.spec.ts`).
- **Test Structure**:
  - Use `describe` blocks to group tests by feature or component.
  - Use `it` for individual test cases.
  - Mock dependencies using Jest's mocking capabilities.
- **Test Coverage**: Aim for at least 80% code coverage. Run `npm run test:cov` to verify.
- **Unit Tests**: Test services and utilities in isolation, mocking database and external dependencies.
  - Example:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: { find: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```
- **Integration Tests**: Test controllers with real HTTP requests using `supertest`.
- **Test Data**: Use factories or fixtures for consistent test data.
- **Default Test Creation**: When creating a new API endpoint, scaffold tests immediately:
  - Test all HTTP methods (GET, POST, etc.).
  - Test success cases, edge cases, and error cases.
  - Mock Typegoose models to avoid hitting the database in unit tests.

## Error Handling
- Use NestJS built-in exception filters for consistent error responses.
- Throw specific exceptions (e.g., `NotFoundException`, `BadRequestException`).
- Example:
```typescript
if (!user) {
  throw new NotFoundException('User not found');
}
```
- Define custom exceptions for domain-specific errors in the `common/exceptions` folder.
- Return standardized error responses:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Logging
- Use NestJS's built-in `Logger` for logging.
- Log important events (e.g., API requests, errors, and critical business logic).
- Example:
```typescript
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(UserService.name);

this.logger.log(`Fetching user with ID: ${id}`);
```
- Configure Winston or similar for production logging with rotation and levels.

## Version Control
- Use Git with a clear branching strategy (e.g., GitFlow or feature branches).
- Write descriptive commit messages (e.g., `feat(user): add user creation endpoint`).
- Include tests in every pull request.

## Code Review
- Require at least one reviewer for pull requests.
- Ensure code adheres to this AGENT.md before merging.
- Check for:
  - Code style compliance.
  - Test coverage.
  - Proper error handling.
  - Documentation for public APIs.