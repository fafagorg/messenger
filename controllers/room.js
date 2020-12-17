const roomService = require('../services/room');

// get all rooms login user 
exports.getRoom = async (req, res) => {
    try {
        let userId = req.decoded.userId
        let redis = req.redis
        let result = await roomService.getRoom(userId, redis);
        return res.status(200).send(result);
    } catch (error) {
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};

// get all messages from a room 
exports.getRoom = async (req, res) => {
    try {
        let roomId = req.params.id
        let userId = req.decoded.userId
        let redis = req.redis
        
        if (!(roomId.split("-")[0] == userId || roomId.split("-")[1] == userId)) {
            return res.status(401).send("Invalid params, You cannot access other users' rooms ");
        }
    
        let result = await roomService.getRoomById(roomId, userId, redis);
        return res.status(200).send(result);
    } catch (error) {
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};