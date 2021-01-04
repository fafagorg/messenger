const roomService = require('../services/room');
const axios = require('axios');

// get all rooms login user 
exports.getRoom = async (req, res) => {
    try {
        let userId = req.decoded.userId
        let redis = req.redis

        // cache
        let cache = await redis.get(`cache:/v1/messenger/room:user:${userId}`);
        if (cache != null){
            console.log('Response cache')
            return res.status(200).send(JSON.parse(cache));
        }

        let result = await roomService.getRoom(userId, redis);
        
        // cache
        await redis.set(
            `cache:/v1/messenger/room:user:${userId}`,
            JSON.stringify(result)
        );
        
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
        // comprobar q la otra persona existe -> integrase con cliente
        

        // check your owner of the room
        if (!(roomId.split("-")[0] == userId || roomId.split("-")[1] == userId)) {
            throw {error: 401, message: "Invalid params, You cannot access other users' rooms "};
        }

        // check product exist
        try{
            await axios({
              url: `${process.env.HOST_PRODUCT}/api/products/${roomId.split("-")[2]}`,
              method: 'GET',
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${req.decoded.token}`
              }
            });
        } catch (error) {
            console.log(error)
            throw {status: 404, message: 'Invalid data'}
        }
    
        // cache
        let cache = await redis.get(`cache:/v1/messenger/room/${roomId}:user:${userId}`);
        if (cache != null){
            console.log('Response cache')
            return res.status(200).send(JSON.parse(cache));
        }

        let result = await roomService.getRoomById(roomId, userId, redis);

        // cache
        await redis.set(
            `cache:/v1/messenger/room/${roomId}:user:${userId}`,
            JSON.stringify(result)
        );

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

// update a room name
exports.updateRoomName = async (req, res) => {
    try {
        let roomId = req.params.id
        let userId = req.decoded.userId
        let roomName = req.body.roomName
        let redis = req.redis
        
        if (!(roomId.split("-")[0] == userId || roomId.split("-")[1] == userId)) {
            return new Error({error: 401, message: "Invalid params, You cannot manage other users' rooms "});
        }
        if (!req.body.roomName) return new Error({error: 401, message: "Invalid params, You must provide a new room name"});
    
        await roomService.updateRoomName(roomId, userId, roomName, redis);
        return res.status(200).send({result: "Success"});
    } catch (error) {
        console.log(error)
        if (error.status && error.message) {
            return res.status(error.status).send({error: error.message});
        }
        return res.status(500).send({error});
    }
};