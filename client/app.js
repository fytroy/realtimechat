// client/app.js

// --- Configuration ---
// Configuration is now handled by config.js and userData.js modules
// Backend URL is automatically determined based on environment

const API_URL = Config.getApiUrl();
const WS_URL = Config.getWebSocketUrl();

// --- Global State Variables ---
let accessToken = null;   // Stores the JWT token received after successful login
let currentUser = null;   // Stores the username of the logged-in user
let currentUserEmail = null; // Stores the email of the logged-in user
let socket = null;        // WebSocket connection object
let currentRoomId = null; // ID of the currently joined chat room

// --- DOM Elements Cache ---
// Authentication Section
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authEmailInput = document.getElementById('auth-email');
const authUsernameInput = document.getElementById('auth-username');
const authPasswordInput = document.getElementById('auth-password');
const registerBtn = document.getElementById('register-btn');
const loginBtn = document.getElementById('login-btn');
const authMessage = document.getElementById('auth-message');
const currentUserNameSpan = document.getElementById('current-user');
const currentUserEmailSpan = document.getElementById('current-user-email');

// Chat Room Management Section
const newRoomNameInput = document.getElementById('new-room-name');
const createRoomBtn = document.getElementById('create-room-btn');
const roomMessage = document.getElementById('room-message');
const roomListDiv = document.getElementById('room-list');

// Chat Window Section
const chatWindow = document.getElementById('chat-window');
const currentRoomNameSpan = document.getElementById('current-room-name');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const leaveRoomBtn = document.getElementById('leave-room-btn');


// --- Authentication Functions ---

/**
 * Handles user registration by sending a POST request to the API.
 */
async function registerUser() {
    const email = authEmailInput.value;
    const username = authUsernameInput.value;
    const password = authPasswordInput.value;

    if (!email || !username || !password) {
        authMessage.textContent = 'Please enter email, username, and password.';
        authMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, username, password })
        });
        const data = await response.json();
        authMessage.textContent = data.message;
        authMessage.style.color = response.ok ? 'green' : 'red';
        if (response.ok) {
            authEmailInput.value = '';
            authUsernameInput.value = '';
            authPasswordInput.value = '';
        }
    } catch (error) {
        console.error('Registration error:', error);
        authMessage.textContent = 'Registration failed. Please try again.';
        authMessage.style.color = 'red';
    }
}

/**
 * Handles user login by sending a POST request to the API.
 * Stores the accessToken, currentUser (username), and currentUserEmail in localStorage upon success.
 */
async function loginUser() {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;

    if (!email || !password) {
        authMessage.textContent = 'Please enter both email and password.';
        authMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();

        if (response.ok) {
            accessToken = data.accessToken;
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            currentUser = tokenPayload.username;
            currentUserEmail = tokenPayload.email;
            const userId = tokenPayload.userId || tokenPayload.id;

            // Save authentication data using userData module
            userData.saveAuthData(accessToken, currentUser, currentUserEmail, userId);

            authSection.style.display = 'none';
            appSection.style.display = 'block';
            currentUserNameSpan.textContent = currentUser;
            currentUserEmailSpan.textContent = currentUserEmail;
            authMessage.textContent = '';

            connectWebSocket();
            loadRooms();
        } else {
            authMessage.textContent = data.message;
            authMessage.style.color = 'red';
        }
    } catch (error) {
        console.error('Login error:', error);
        authMessage.textContent = 'Login failed. Please try again.';
        authMessage.style.color = 'red';
    }
}

/**
 * Checks for existing authentication token in localStorage on page load.
 * If found, bypasses login form and connects WebSocket.
 */
function checkAuth() {
    // Load authentication data using userData module
    const authData = userData.getAuthData();
    
    if (userData.isAuthenticated()) {
        accessToken = authData.accessToken;
        currentUser = authData.currentUser;
        currentUserEmail = authData.currentUserEmail;
        
        authSection.style.display = 'none';
        appSection.style.display = 'block';
        currentUserNameSpan.textContent = currentUser;
        currentUserEmailSpan.textContent = currentUserEmail;
        connectWebSocket();
        loadRooms();
    }
}


// --- WebSocket Functions ---

/**
 * Establishes a WebSocket connection to the server.
 * Handles incoming messages, connection lifecycle, and authentication.
 */
function connectWebSocket() {
    if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected.');
        return;
    }

    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
        console.log('WebSocket connection established.');
        socket.send(JSON.stringify({ type: 'authenticate', payload: { token: accessToken } }));
    };

    socket.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            console.log('Received WebSocket message:', message);

            switch (message.type) {
                case 'authenticated':
                    console.log('WebSocket authenticated successfully.');
                    if (message.user) {
                        currentUser = message.user.username;
                        currentUserEmail = message.user.email;
                        currentUserNameSpan.textContent = currentUser;
                        currentUserEmailSpan.textContent = currentUserEmail;
                    }
                    break;
                case 'authFailed':
                    console.error('WebSocket authentication failed:', message.message);
                    alert('WebSocket authentication failed. Please log in again.');
                    userData.clearAuthData();
                    window.location.reload();
                    break;
                case 'joinedRoom':
                    currentRoomId = message.roomId;
                    currentRoomNameSpan.textContent = message.roomName;
                    chatWindow.style.display = 'block';
                    messagesDiv.innerHTML = '';
                    addSystemMessage(message.message);
                    break;
                case 'historicalMessages':
                    messagesDiv.innerHTML = '';
                    addSystemMessage('--- Previous Conversation ---');
                    message.messages.forEach(msg => {
                        displayMessage(msg.username, msg.message, msg.timestamp);
                    });
                    addSystemMessage('--- End of Previous Conversation ---');
                    break;
                case 'chatMessage':
                    displayMessage(message.username, message.message, message.timestamp);
                    break;
                case 'userJoined':
                    addSystemMessage(`${message.username} has joined the room.`);
                    break;
                case 'userLeft':
                    addSystemMessage(`${message.username} has left the room.`);
                    break;
                case 'error':
                    addSystemMessage(`Error: ${message.message}`);
                    console.error('WebSocket error from server:', message.message);
                    break;
                default:
                    console.log('Unhandled WebSocket message type:', message.type);
            }
        } catch (error) {
            console.error('Error parsing or handling WebSocket message:', error, event.data);
            addSystemMessage('Received malformed message from server.');
        }
    };

    socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (accessToken) {
            console.log('Attempting to reconnect WebSocket in 3 seconds...');
            setTimeout(connectWebSocket, 3000);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addSystemMessage('WebSocket connection error.');
    };
}

/**
 * Sends a chat message through the WebSocket.
 */
function sendMessage() {
    if (socket && socket.readyState === WebSocket.OPEN && currentRoomId) {
        const message = messageInput.value;
        if (message.trim()) {
            socket.send(JSON.stringify({
                type: 'chatMessage',
                payload: {
                    roomId: currentRoomId,
                    message: message
                }
            }));
            messageInput.value = '';
        }
    } else {
        console.warn('WebSocket not connected or not in a room. Message not sent.');
        addSystemMessage('Cannot send message: not connected or not in a room.');
    }
}

/**
 * Sends a request to the server via WebSocket to join a specific room.
 * @param {string} roomId - The ID of the room to join.
 * @param {string} roomName - The name of the room (for UI update).
 */
function joinRoom(roomId, roomName) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'joinRoom',
            payload: { roomId: roomId }
        }));
        currentRoomNameSpan.textContent = roomName;
    } else {
        addSystemMessage('WebSocket not connected. Cannot join room.');
        console.warn('WebSocket not connected. Cannot join room.');
    }
}

/**
 * Handles leaving the current chat room.
 */
function leaveRoom() {
    if (currentRoomId && socket && socket.readyState === WebSocket.OPEN) {
        currentRoomId = null;
        chatWindow.style.display = 'none';
        messagesDiv.innerHTML = '';
        addSystemMessage('You have left the chat room.');
        loadRooms();
    }
}


// --- Room Management Functions (REST API Calls) ---

/**
 * Fetches the list of available chat rooms from the REST API
 * and displays them in the UI.
 */
async function loadRooms() {
    try {
        const response = await fetch(`${API_URL}/rooms`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                console.error('Authentication failed during room load. Redirecting to login.');
                userData.clearAuthData();
                window.location.reload();
                return;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rooms = await response.json();

        roomListDiv.innerHTML = '';
        rooms.forEach(room => {
            const roomItem = document.createElement('div');
            roomItem.classList.add('room-item');
            roomItem.innerHTML = `
                <span>${room.name} (Created by: ${room.creator})</span>
                <button data-room-id="${room.id}" data-room-name="${room.name}">Join</button>
            `;
            roomListDiv.appendChild(roomItem);
        });
    } catch (error) {
        console.error('Error loading rooms:', error);
        roomMessage.textContent = 'Failed to load rooms.';
        roomMessage.style.color = 'red';
    }
}

/**
 * Sends a request to the REST API to create a new chat room.
 */
async function createRoom() {
    const roomName = newRoomNameInput.value;
    if (!roomName.trim()) {
        roomMessage.textContent = 'Room name cannot be empty.';
        roomMessage.style.color = 'red';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ name: roomName })
        });
        const data = await response.json();

        roomMessage.textContent = data.message;
        roomMessage.style.color = response.ok ? 'green' : 'red';
        if (response.ok) {
            newRoomNameInput.value = '';
            loadRooms();
        }
    } catch (error) {
        console.error('Error creating room:', error);
        roomMessage.textContent = 'Failed to create room.';
        roomMessage.style.color = 'red';
    }
}


// --- UI Helper Functions ---

/**
 * Appends a new chat message to the messages display area.
 * @param {string} username - The sender's username.
 * @param {string} message - The message content.
 * @param {number} timestamp - The timestamp of the message.
 */
function displayMessage(username, message, timestamp) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    const date = new Date(timestamp);
    messageElement.innerHTML = `
        <span class="username">${username}</span>:
        <span class="content">${message}</span>
        <span class="timestamp">(${date.toLocaleTimeString()})</span>
    `;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Appends a system message (e.g., user joined/left) to the messages display area.
 * @param {string} message - The system message content.
 */
function addSystemMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'system-message');
    messageElement.textContent = message;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}


// --- Event Listeners ---

registerBtn.addEventListener('click', registerUser);
loginBtn.addEventListener('click', loginUser);

createRoomBtn.addEventListener('click', createRoom);

sendBtn.addEventListener('click', sendMessage);
leaveRoomBtn.addEventListener('click', leaveRoom);

messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

roomListDiv.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.hasAttribute('data-room-id')) {
        const roomId = event.target.getAttribute('data-room-id');
        const roomName = event.target.getAttribute('data-room-name');
        joinRoom(roomId, roomName);
    }
});


// --- Initial Setup ---

checkAuth();