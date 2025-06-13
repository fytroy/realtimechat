# Real-Time Chat Application

This project is a real-time chat application. Key features include user registration and login using JWT-based authentication, the ability for users to create and join different chat rooms, and live messaging within rooms. The backend is built with Node.js and Express, utilizing WebSockets (ws library) for real-time communication. User credentials are secured using bcryptjs, and sessions are managed with JSON Web Tokens. The frontend is constructed with HTML, CSS, and vanilla JavaScript, providing a dynamic user interface for interacting with the chat service.

## Features

- Real-time messaging using WebSockets
- User registration and login (JWT-based authentication)
- Create and join chat rooms
- View historical messages upon joining a room
- Display of users joining/leaving rooms

## Technologies Used

-   **Backend**: Node.js, Express.js, WebSockets (`ws` library), JWT (`jsonwebtoken`), bcryptjs
-   **Frontend**: HTML, CSS, JavaScript (Vanilla JS)
-   **Data Storage**: In-memory JavaScript arrays (for users and rooms)

## Project Structure

-   `client/`: Contains the frontend application.
    -   `index.html`: The main HTML file for the chat interface.
    -   `style.css`: Styles for the application.
    -   `app.js`: JavaScript code for handling client-side logic, DOM manipulation, and WebSocket communication.
-   `server/`: Contains the backend application.
    -   `index.js`: The main entry point for the server, sets up Express and WebSockets.
    -   `package.json`: Defines project dependencies and scripts.
    -   `controllers/`: Handles business logic for authentication and room management.
        -   `authController.js`: Manages user registration and login.
        -   `roomController.js`: Manages chat room creation and listing.
    -   `data/`: In-memory data stores.
        -   `users.js`: Stores user data.
        -   `rooms.js`: Stores room data and messages.
    -   `middleware/`: Contains Express middleware.
        -   `authMiddleware.js`: Middleware for verifying JWT tokens.
    -   `routes/`: Defines API routes.
        -   `authRoutes.js`: Routes for authentication.
        -   `roomRoutes.js`: Routes for room management.
    -   `utils/`: Utility functions.
        -   `websocketHandler.js`: Manages WebSocket connections, message broadcasting, and event handling.

## Setup and Usage

1.  **Install Server Dependencies**:
    Navigate to the server directory and install the necessary Node.js packages.
    ```bash
    cd server
    npm install
    ```

2.  **Run the Server**:
    Once dependencies are installed, start the Node.js server from the `server` directory.
    ```bash
    cd server
    node index.js
    ```
    The server will start on port 3000 by default.

3.  **Access the Application**:
    Open the `client/index.html` file in your web browser.
    ```
    file:///path/to/your/project/client/index.html
    ```
    Replace `/path/to/your/project/` with the actual path to where you've cloned or downloaded the project.

## API Endpoints (Briefly)

-   `POST /api/auth/register`: Registers a new user.
    -   Payload: `{ "email": "user@example.com", "username": "user", "password": "password123" }`
-   `POST /api/auth/login`: Logs in an existing user.
    -   Payload: `{ "email": "user@example.com", "password": "password123" }`
    -   Returns: `{ "accessToken": "JWT_TOKEN" }`
-   `GET /api/rooms`: Retrieves a list of available chat rooms (Requires Authentication).
-   `POST /api/rooms`: Creates a new chat room (Requires Authentication).
    -   Payload: `{ "name": "New Room Name" }`

## WebSocket Events (Briefly)

### Client to Server:

-   `authenticate`: Sent by the client after establishing a WebSocket connection to authenticate using the JWT.
    -   Payload: `{ "token": "JWT_TOKEN" }`
-   `joinRoom`: Sent by the client to join a specific chat room.
    -   Payload: `{ "roomId": "ROOM_ID" }`
-   `chatMessage`: Sent by the client to broadcast a message to the current room.
    -   Payload: `{ "roomId": "ROOM_ID", "message": "Hello everyone!" }`

### Server to Client:

-   `authenticated`: Sent by the server upon successful WebSocket authentication.
    -   Payload: `{ "message": "Successfully authenticated.", "user": { "username": "user", "email": "user@example.com" } }`
-   `authFailed`: Sent by the server if WebSocket authentication fails.
    -   Payload: `{ "message": "Invalid or expired token." }`
-   `joinedRoom`: Sent by the server when the client successfully joins a room. Also includes historical messages if any.
    -   Payload: `{ "roomId": "ROOM_ID", "roomName": "Room Name", "message": "Joined room: Room Name" }`
-   `historicalMessages`: Sent by the server to provide past messages for a room when a user joins.
    -   Payload: `{ "messages": [{ "username": "user1", "message": "Hi", "timestamp": 1678886400000 }, ...] }`
-   `chatMessage`: Sent by the server to broadcast a new message to all clients in a room.
    -   Payload: `{ "username": "user", "message": "Hello everyone!", "timestamp": 1678886500000, "roomId": "ROOM_ID" }`
-   `userJoined`: Sent by the server to notify clients in a room that a new user has joined.
    -   Payload: `{ "username": "newUser", "timestamp": 1678886600000 }`
-   `userLeft`: Sent by the server to notify clients in a room that a user has left.
    -   Payload: `{ "username": "leavingUser", "timestamp": 1678886700000 }`
-   `error`: Sent by the server to communicate errors to the client (e.g., room not found, invalid message).
    -   Payload: `{ "message": "Error details here." }`
