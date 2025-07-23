# El Gorrilla Server

## Project Overview

This is the backend server for "El Gorrilla", a web application designed to help users find parking spots in busy areas of a city. The main goal is to reduce the time and frustration associated with searching for parking.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JSON Web Tokens (JWT)

## Project Structure

The project follows a standard Node.js application structure:

- `app.js`: Main application setup and middleware configuration.
- `server.js`: The entry point for running the server.
- `config/`: Contains application configuration, such as database connection strings.
- `db/`: Handles the MongoDB database connection.
- `error-handling/`: Contains custom error-handling middleware.
- `middlewares/`: Houses custom middleware, including `auth.middlewares.js` for JWT authentication and authorization.
- `models/`: Defines the Mongoose schemas for `User`, `Cars`, and `Calles` (Streets).
- `routes/`: Contains the API routes for different resources:
    - `auth.routes.js`: User authentication (signup, login, verify).
    - `cars.routes.js`: CRUD operations for cars.
    - `calle.routes.js`: CRUD operations for streets and managing parking spots.
    - `index.routes.js`: Main router that combines all other routes.

## How to Run

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run in Development Mode:**
    ```bash
    npm run dev
    ```
    This will start the server with `nodemon`, which automatically restarts the server on file changes.

3.  **Run in Production Mode:**
    ```bash
    npm start
    ```

## Available Scripts

- `npm start`: Starts the server for production.
- `npm run dev`: Starts the server in development mode using `nodemon`.
