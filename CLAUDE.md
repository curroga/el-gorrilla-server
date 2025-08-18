# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm install` - Install dependencies
- `npm run dev` - Start development server with file watching (uses --watch --env-file=env/.env)
- `npm start` - Start production server (uses --env-file=env/.env)

## Architecture Overview

This is a Node.js/Express.js REST API for "El Gorrilla", a parking spot finder application.

### Core Structure

- **Entry Point**: `server.js` imports and starts the Express app from `app.js`
- **App Configuration**: `app.js` sets up the Express app, middleware, routes, and error handling
- **Database**: MongoDB connection configured in `db/index.js` 
- **Middleware**: Global middleware in `config/index.js`, authentication middleware in `middlewares/auth.middlewares.js`

### Route Organization

All API routes are prefixed with `/api` and organized in `routes/`:
- `/api/auth` - Authentication (signup, login, verify)
- `/api/calle` - Street/parking management (admin and user operations)
- `/api/car` - User car management

### Data Models (Mongoose)

- **User**: username, email, password, role (user/admin), favoritos array
- **Calles**: name, numAparcamientos, numOcupados, numLibres, coches array, positionMarker
- **Cars**: modelo, matricula, color, owner reference

### Authentication System

- JWT-based authentication using `express-jwt`
- Two middleware functions: `isAuthenticated` (verifies JWT) and `isAdmin` (checks admin role)
- Tokens expected in Authorization header as "Bearer <token>"
- Admin-only routes for street management operations

### Environment Configuration

- Uses Node.js `--env-file=env/.env` for environment variables
- Key variables: `TOKEN_SECRET`, `MONGODB_URI`, `ORIGIN` (CORS), `PORT`
- Default MongoDB connection string includes Docker setup with root/password auth

### Key Features

- Street/parking spot management with real-time occupancy tracking
- User favorites system for streets
- Car registration and parking/unparking operations
- Role-based access control (user vs admin)
- CORS configured for frontend integration

## Development Notes

- The codebase uses Spanish naming conventions (calles, coches, etc.)
- Error handling is centralized in `error-handling/index.js`
- Morgan logger for HTTP request logging in development
- Cookie parser and CORS middleware configured for frontend integration