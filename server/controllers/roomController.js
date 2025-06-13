const { rooms, addRoom } = require('../data/rooms'); // In-memory room store

const createRoom = (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Room name is required.' });
    }
    if (rooms.find(room => room.name === name)) {
        return res.status(409).json({ message: 'Room with this name already exists.' });
    }
    const newRoom = { id: Date.now().toString(), name, creator: req.user.username };
    addRoom(newRoom);
    res.status(201).json({ message: 'Room created successfully!', room: newRoom });
};

const getRooms = (req, res) => {
    res.json(rooms);
};

module.exports = {
    createRoom,
    getRooms
};