const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, roomController.createRoom);
router.get('/', authenticateToken, roomController.getRooms);

module.exports = router;