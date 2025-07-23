# El Gorrilla Server

## Descripción del Proyecto

"El Gorrilla" es el backend de una aplicación web diseñada para ayudar a los usuarios a encontrar plazas de aparcamiento en zonas concurridas de una ciudad. El objetivo principal es reducir el tiempo y la frustración asociados a la búsqueda de aparcamiento.

## Tech Stack

-   **Backend:** Node.js, Express.js
-   **Base de Datos:** MongoDB con Mongoose
-   **Autenticación:** JSON Web Tokens (JWT)

## Cómo Ejecutar

1.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

2.  **Ejecutar en Modo Desarrollo:**
    ```bash
    npm run dev
    ```
    Esto iniciará el servidor con `nodemon`, que reinicia automáticamente el servidor al cambiar los archivos.

3.  **Ejecutar en Modo Producción:**
    ```bash
    npm start
    ```

## Endpoints de la API

A continuación se detallan los endpoints disponibles.

### Autenticación (`/api/auth`)

| Método | Ruta      | Descripción                            | Requiere Autenticación |
| :----- | :-------- | :------------------------------------- | :--------------------- |
| `POST` | `/signup` | Registra un nuevo usuario.             | No                     |
| `POST` | `/login`  | Inicia sesión y devuelve un token JWT. | No                     |
| `GET`  | `/verify` | Verifica el token del usuario.         | **Sí**                 |

### Calles (`/api/calle`)

| Método   | Ruta                        | Descripción                                | Requiere Autenticación | Solo Admin |
| :------- | :-------------------------- | :----------------------------------------- | :--------------------- | :--------- |
| `GET`    | `/`                         | Obtiene todas las calles.                  | **Sí**                 | No         |
| `POST`   | `/`                         | Crea una nueva calle.                      | **Sí**                 | **Sí**     |
| `GET`    | `/:calleId`                 | Obtiene los detalles de una calle.         | **Sí**                 | No         |
| `PATCH`  | `/:calleId`                 | Actualiza una calle.                       | **Sí**                 | **Sí**     |
| `DELETE` | `/:calleId`                 | Elimina una calle.                         | **Sí**                 | **Sí**     |
| `GET`    | `/favoritos`                | Obtiene las calles favoritas del usuario.  | **Sí**                 | No         |
| `POST`   | `/favoritos/:calleId`       | Añade una calle a favoritos.               | **Sí**                 | No         |
| `DELETE` | `/favoritos/:calleId`       | Elimina una calle de favoritos.            | **Sí**                 | No         |
| `POST`   | `/:calleId/coches/:cocheId` | Añade un coche a una calle (aparcar).      | **Sí**                 | No         |
| `DELETE` | `/:calleId/coches/:cocheId` | Quita un coche de una calle (liberar).     | **Sí**                 | No         |

### Coches (`/api/car`)

| Método   | Ruta      | Descripción                         | Requiere Autenticación |
| :------- | :-------- | :---------------------------------- | :--------------------- |
| `GET`    | `/`       | Obtiene todos los coches del usuario. | **Sí**                 |
| `POST`   | `/`       | Crea un nuevo coche para el usuario.  | **Sí**                 |
| `GET`    | `/:carId` | Obtiene los detalles de un coche.   | **Sí**                 |
| `PATCH`  | `/:carId` | Actualiza un coche.                 | **Sí**                 |
| `DELETE` | `/:carId` | Elimina un coche.                   | **Sí**                 |

## Modelos de Datos

### User

-   `username`: `String`, único y requerido.
-   `email`: `String`, único y requerido.
-   `password`: `String`, requerido.
-   `role`: `String`, enum (`user`, `admin`), por defecto `user`.
-   `favoritos`: `[ObjectId]`, referencia al modelo `Calles`.

### Calles

-   `name`: `String`, requerido.
-   `numAparcamientos`: `Number`, requerido.
-   `numOcupados`: `Number`, por defecto `0`.
-   `numLibres`: `Number`, por defecto `0`.
-   `coches`: `[ObjectId]`, referencia al modelo `Cars`.
-   `positionMarker`: `[Number]`.

### Cars

-   `modelo`: `String`, requerido.
-   `matricula`: `String`, requerida.
-   `color`: `String`.
-   `owner`: `ObjectId`, referencia al modelo `User`.
-   `timestamps`: `true`.

## Middlewares

-   `isAuthenticated`: Verifica la validez del token JWT. Protege las rutas que requieren que un usuario esté autenticado.
-   `isAdmin`: Comprueba si el usuario autenticado tiene el rol de `admin`. Se usa para proteger rutas de acceso restringido.