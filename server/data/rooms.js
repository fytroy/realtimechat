// server/data/rooms.js
const rooms = [
    { id: 'general', name: 'General Chat', creator: 'system', messages: [] },
    { id: 'random', name: 'Random Talk', creator: 'system', messages: [] }
];

const addRoom = (room) => {
    rooms.push(room);
};

// New function to add a message to a room
const addMessageToRoom = (roomId, message) => {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        room.messages.push(message);
        // Optional: Limit historical messages to a certain number (e.g., last 50)
        if (room.messages.length > 50) {
            room.messages.shift(); // Remove the oldest message
        }
    }
};

// New function to get messages for a room
const getRoomMessages = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return room ? room.messages : [];
};


module.exports = { rooms, addRoom, addMessageToRoom, getRoomMessages };