# AGENT.md - API Testing Tool Project

## Project Overview
This project is an API testing tool similar to Postman, designed to facilitate testing of RESTful APIs with support for GET, POST, PUT, and DELETE methods. The tool allows users to send requests with optional Bearer token authentication, save requests automatically as "unsaved" drafts, create checkpoints for saved versions, and roll back to previous saved states. All changes are cached by default to ensure a seamless user experience. The project is divided into two main components:

- **Backend**: Built with NestJS and Typegoose for MongoDB, handling API logic, request storage, and versioning.
- **Frontend**: Built with Next.js, shadcn/ui, React Query, and Axios for a responsive and intuitive user interface.

This AGENT.md file serves as the root-level guide, with specific guidelines for the frontend and backend provided in their respective `AGENT.md` files.

## Table of Contents
- [Project Structure](#project-structure)
- [Features](#features)
- [General Guidelines](#general-guidelines)
- [Version Control](#version-control)
- [Code Review](#code-review)
- [Frontend Guidelines](#frontend-guidelines)
- [Backend Guidelines](#backend-guidelines)

## Project Structure
The project is organized with separate directories for frontend and backend:
```
api-testing-tool/
├── backend/                    # NestJS backend
│   ├── src/
│   ├── AGENT.md                # Backend-specific guidelines
│   └── ...
├── frontend/                   # Next.js frontend
│   ├── app/
│   ├── AGENT.md                # Frontend-specific guidelines
│   └── ...
├── AGENT.md                    # Root project guidelines (this file)
├── README.md
└── package.json
```

- Place shared configurations (e.g., `.gitignore`, `docker-compose.yml`) at the root.
- Each subproject (`backend`, `frontend`) has its own `AGENT.md` for specific guidelines.

## Features
- **API Testing**:
  - Support for GET, POST, PUT, and DELETE HTTP methods.
  - Optional Bearer token authentication for secure API requests.
  - Configurable headers, query parameters, and request bodies.
- **Request Management**:
  - Automatically save requests as "unsaved" drafts in the backend.
  - Create checkpoints for saved versions when explicitly saved by the user.
  - Rollback to any saved checkpoint, with all changes cached by default.
- **User Interface**:
  - Intuitive UI for composing and sending API requests.
  - Display request history and saved checkpoints.
- **Persistence**:
  - Store request history and checkpoints in MongoDB using Typegoose.
  - Cache unsaved changes locally (frontend) and sync with the backend.

## General Guidelines
- **TypeScript**: Use TypeScript across both frontend and backend with strict mode enabled.
- **Testing**: Write unit and integration tests for every feature (API endpoints, components, hooks).
- **Documentation**: Document public APIs, components, and hooks using JSDoc.
- **Environment Variables**: Use `.env` files for configuration (e.g., API URLs, MongoDB connection strings).
- **Error Handling**: Implement consistent error handling with user-friendly messages.
- **Performance**: Optimize for low latency in API requests and UI rendering.

## Version Control
- Use Git with a branching strategy (e.g., GitFlow or feature branches).
- Prefix commit messages with scope (`feat`, `fix`, `docs`, etc.) and subproject (`frontend`, `backend`).
  - Example: `feat(frontend): add request form component`.
- Include tests in every pull request.

## Code Review
- Require at least one reviewer for pull requests.
- Ensure adherence to the respective `AGENT.md` files for frontend and backend.
- Verify test coverage, code style, and feature completeness.

## Frontend Guidelines
The frontend is built with Next.js, shadcn/ui, React Query, and Axios. Detailed guidelines are provided in `frontend/AGENT.md`. Key points:
- Use shadcn/ui for consistent UI components.
- Manage API requests with React Query and Axios.
- Cache unsaved changes locally using React Query or browser storage.
- Implement rollback functionality using saved checkpoints from the backend.
- Test components, hooks, and API interactions with Jest and React Testing Library.

See `frontend/AGENT.md` for full details.

## Backend Guidelines
The backend is built with NestJS and Typegoose. Detailed guidelines are provided in `backend/AGENT.md`. Key points:
- Use Typegoose for MongoDB schema definitions to store requests and checkpoints.
- Implement endpoints for saving unsaved drafts, creating checkpoints, and retrieving rollback versions.
- Support Bearer token authentication for API testing endpoints.
- Test all endpoints with Jest, including success and error cases.

See `backend/AGENT.md` for full details.