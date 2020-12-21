const roomService = require('../services/room');

// get all rooms login user 
exports.getRoom = async (req, res) => {
    try {
        let userId = req.decoded.userId
        let redis = req.redis

        let result = await roomService.getRoom(userId, redis);
        return res.status(200).send(result);
    } catch (error) {
        console.log(error)
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};

// get all messages from a room 
exports.getRoomById = async (req, res) => {
    try {
        let roomId = req.params.id
        let userId = req.decoded.userId
        let redis = req.redis
        
        if (!(roomId.split("-")[0] == userId || roomId.split("-")[1] == userId)) {
            return new Error({error: 401, message: "Invalid params, You cannot access other users' rooms "});
        }
    
        let result = await roomService.getRoomById(roomId, userId, redis);
        return res.status(200).send(result);
    } catch (error) {
        console.log(error)
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};

// delete a room 
exports.deleteRoomById = async (req, res) => {
    console.log('EEEOOOOO')
    try {
        let roomId = req.params.id
        let userId = req.decoded.userId
        let redis = req.redis
        
        if (!(roomId.split("-")[0] == userId || roomId.split("-")[1] == userId)) {
            return new Error({error: 401, message: "Invalid params, You cannot manage other users' rooms "});
        }
    
        await roomService.deleteRoomById(roomId, userId, redis);
        return res.status(200).send({result: "Success"});
    } catch (error) {
        console.log(error)
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};