# FRONTEND.md - Next.js Project Best Practices

This document outlines the best practices, coding style, and testing guidelines for the Next.js frontend project using shadcn/ui, React Query, and Axios.

## Table of Contents
- [Project Structure](#project-structure)
- [Coding Style](#coding-style)
- [Component Development with shadcn/ui](#component-development-with-shadcnui)
- [Data Fetching with React Query and Axios](#data-fetching-with-react-query-and-axios)
- [Testing Guidelines](#testing-guidelines)
- [Error Handling](#error-handling)
- [Logging](#logging)
- [Version Control](#version-control)
- [Code Review](#code-review)

## Project Structure
Adopt a modular structure to keep the codebase organized and maintainable:
```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (required for App Router)
│   ├── page.tsx            # Home page (`/`)
│   ├── globals.css         # Global CSS styles
│   ├── favicon.ico         # Favicon
│   ├── api/                # Optional: Proxy API routes (if needed)
│   │   └── proxy/
│   │       └── route.ts    # Proxy to backend (e.g., `/api/proxy/hello`)
│   ├── dashboard/          # Example nested route
│   │   ├── layout.tsx      # Layout for `/dashboard`
│   │   └── page.tsx        # Page for `/dashboard`
│   ├── [slug]/             # Dynamic route (e.g., `/post/[slug]`)
│   │   └── page.tsx        # Page for dynamic route
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── shared/             # Reusable components (e.g., Button, Modal)
│   └── features/           # Feature-specific components (e.g., AuthForm, DashboardChart)
├── hooks/                  # Custom React hooks
├── lib/
│   ├── api/                # API client (Axios/Fetch setup)
│   │   └── client.ts       # Axios instance or Fetch wrapper
│   ├── query/              # React Query setup (e.g., QueryClient)
│   │   └── index.ts
│   └── utils.ts            # General utilities
├── public/
│   ├── images/             # Static images
│   ├── fonts/              # Custom fonts
│   └── favicon.ico         # Static favicon
├── styles/
│   ├── tailwind.css        # Tailwind CSS file
│   └── custom.css          # Additional custom styles
├── tests/
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── middleware.ts           # Middleware (e.g., auth, redirects)
├── next.config.mjs         # Next.js configuration
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript config (if using TypeScript)
├── tailwind.config.js      # Tailwind config (if using Tailwind)
├── .env.local              # Environment variables (e.g., API_URL)
├── .gitignore              # Git ignore
└── AGENT.md               # this file.

```

- Use App Router (`app/`) for Next.js routing.
- Group components by purpose: `ui` for shadcn/ui, `shared` for reusable components, `features` for domain-specific components.
- Place utilities, Axios instances, and React Query setup in `lib/`.

## Coding Style
- **Language**: Use TypeScript with strict mode (`strict: true` in `tsconfig.json`).
- **Formatting**: Use Prettier with:
  - Single quotes
  - Trailing commas
  - 2-space indentation
  - Print width: 80
- **Linting**: Use ESLint with `@typescript-eslint` and `eslint-plugin-react` for consistent code quality.
- **Naming Conventions**:
  - Use PascalCase for components and interfaces (e.g., `UserCard`, `IUser`).
  - Use camelCase for variables, functions, and hooks (e.g., `useUserData`, `fetchUser`).
  - Use kebab-case for file names (e.g., `user-card.tsx`).
- **Imports**:
  - Organize imports: Node.js built-ins, external libraries, internal modules.
  - Use absolute imports with `@` aliases (e.g., `@/components/shared/button`).
- **Documentation**: Use JSDoc for public hooks, components, and utilities.

## Component Development with shadcn/ui
- Use **shadcn/ui** for UI components, installed via CLI and customized with Tailwind CSS.
- Store shadcn/ui components in `components/ui/` to keep them isolated.
- Example component usage:
```tsx
import { Button } from '@/components/ui/button';

export function SubmitButton() {
  return <Button variant="default">Submit</Button>;
}
```
- Customize shadcn/ui components in `components/ui/` if needed, but avoid modifying core styles directly.
- Use Tailwind CSS for styling, leveraging shadcn/ui’s Tailwind integration.
- Create reusable feature-specific components in `components/features/` (e.g., `UserProfileCard`).
- Follow React best practices:
  - Keep components small and focused.
  - Use functional components with hooks.
  - Avoid inline styles; use Tailwind classes.

## Data Fetching with React Query and Axios
- Use **React Query** for data fetching, caching, and state management.
- Configure Axios for HTTP requests in `lib/axios.ts`:
```tsx
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```
- Create custom hooks in `hooks/` for data fetching with React Query:
```tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const { data } = await api.get(`/users/${id}`);
      return data;
    },
  });
}
```
- Use environment variables for API URLs (e.g., `NEXT_PUBLIC_API_URL`).
- Implement retry logic and error boundaries with React Query.
- Cache data appropriately using React Query’s `staleTime` and `cacheTime`.

## Testing Guidelines
- **Mandatory Testing**: Write unit and integration tests for every component, hook, and API interaction.
- **Testing Framework**: Use Jest with `@testing-library/react` for testing.
- **File Naming**: Place test files in `tests/` or next to the source file with a `.test.tsx` suffix (e.g., `user-card.test.tsx`).
- **Test Structure**:
  - Use `describe` blocks to group tests by component or hook.
  - Use `it` for individual test cases.
  - Mock Axios requests using `msw` or Jest mocks.
- **Test Coverage**: Aim for at least 80% coverage. Run `npm run test -- --coverage` to verify.
- **Unit Tests**: Test components and hooks in isolation.
  - Example:
```tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from '@/components/features/user-card';

describe('UserCard', () => {
  it('renders user name', () => {
    render(<UserCard name="John Doe" />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```
- **Integration Tests**: Test API interactions with mocked responses using `msw`.
- **Default Test Creation**: When creating a new component or API hook, scaffold tests immediately:
  - Test rendering, user interactions, and API success/error cases.
  - Mock React Query hooks and Axios responses.
- Use `react-testing-library` for DOM testing and `msw` for API mocking.

## Error Handling
- Use React Query’s error handling for API errors:
```tsx
const { data, error, isLoading } = useUser(id);

if (error) {
  return <div>Error: {error.message}</div>;
}
```
- Implement global error boundaries using React’s `ErrorBoundary` component.
- Display user-friendly error messages with shadcn/ui components (e.g., `Alert`).
- Standardize error responses from the backend:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Logging
- Use `console.log` sparingly; prefer a logging library like `pino` for production.
- Log critical events (e.g., API failures, component errors) with context:
```tsx
import pino from 'pino';

const logger = pino();

logger.info({ userId: id }, 'Fetching user data');
```
- Avoid logging sensitive data (e.g., passwords, tokens).

## Version Control
- Use Git with a clear branching strategy (e.g., GitFlow or feature branches).
- Write descriptive commit messages (e.g., `feat(user): add user profile component`).
- Include tests in every pull request.

## Code Review
- Require at least one reviewer for pull requests.
- Ensure code adheres to this FRONTEND.md before merging.
- Check for:
  - Code style compliance.
  - Test coverage.
  - Proper error handling.
  - Accessibility (e.g., ARIA attributes with shadcn/ui components).
  - Performance optimizations (e.g., React Query caching, Next.js SSR/SSG).