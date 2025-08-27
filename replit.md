# Overview

CodeConnect is a modern web platform that connects young students with coding mentors for personalized learning experiences. The application facilitates mentor discovery, booking sessions, and managing educational relationships in the programming space. Built as a full-stack application, it provides a seamless experience for both students seeking to learn programming and mentors wanting to teach and share their expertise.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side application is built using React with TypeScript, leveraging modern development practices and a component-based architecture. The frontend uses Vite as the build tool and development server, providing fast hot module replacement and optimized builds.

**UI Framework**: The application uses shadcn/ui components built on top of Radix UI primitives, providing a consistent and accessible design system. Tailwind CSS handles styling with custom CSS variables for theming support.

**Routing**: Client-side routing is implemented using Wouter, a lightweight React router that handles navigation between different pages like home, mentor profiles, and booking forms.

**State Management**: React Query (TanStack Query) manages server state, caching API responses and handling data synchronization. Local component state is managed with React hooks.

**Form Handling**: Forms utilize React Hook Form with Zod schema validation for type-safe form data processing.

## Backend Architecture

The server-side application is built with Express.js and TypeScript, following RESTful API design principles.

**API Structure**: The backend exposes REST endpoints for managing mentors, students, bookings, and reviews. Routes are organized in a modular structure with dedicated handlers for each resource type.

**Database Layer**: Uses Drizzle ORM with PostgreSQL for type-safe database operations. The ORM provides a TypeScript-first approach to database queries and migrations.

**Storage Interface**: Implements a storage abstraction layer that encapsulates all database operations, making the codebase more maintainable and testable.

## Data Storage Solutions

**Primary Database**: PostgreSQL serves as the main data store, configured to work with Neon's serverless PostgreSQL offering for cloud deployment.

**Schema Design**: The database schema includes tables for users, mentors, students, bookings, achievements, and reviews, with proper foreign key relationships and indexing.

**Connection Management**: Uses connection pooling through Neon's serverless client to handle database connections efficiently.

## Authentication and Authorization

The current implementation includes user role management (student, mentor, admin) in the database schema, though specific authentication mechanisms are not fully implemented in the visible codebase. The system is designed to support role-based access control.

## External Dependencies

**UI Components**: Extensive use of Radix UI primitives for accessible, unstyled components that serve as the foundation for the custom UI library.

**Database Connectivity**: Neon Database provides serverless PostgreSQL hosting with WebSocket support for real-time features.

**Development Tools**: 
- Vite for fast development and building
- TypeScript for type safety across the entire stack
- Tailwind CSS for utility-first styling
- Drizzle Kit for database migrations and schema management

**Validation**: Zod provides runtime type validation and schema definition, ensuring data integrity between client and server.

**Date Handling**: date-fns library for consistent date manipulation and formatting.

The architecture prioritizes developer experience with strong typing throughout the stack, modern tooling, and a clear separation of concerns between frontend and backend components.