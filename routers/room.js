const express = require('express');
const router = new express.Router();
const roomController = require('../controllers/room');

router.get('/', roomController.getRoom);
router.get('/:id', roomController.getRoomById);

module.exports = router;