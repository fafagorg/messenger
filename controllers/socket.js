const commons = require("../commons");

exports.socket = function(io, redis, axios) {

    // Authentication middleware
    io.of("/chat").use(async (socket, next) => {
        if (!(socket.handshake.query && socket.handshake.query.token)) {
            next(new Error("Authentication error"));
        }
    
        let token = socket.handshake.query.token.replace('Bearer ', '');
        try {
            let decoded = await commons.decodedJWT(token)
            socket.decoded = decoded;
            socket.token = token;
            next();
        } catch (error) {
            console.log(error.response)
            return next(new Error("Authentication error"));
        }
    });
    
    // Connection authenticated
    io.of("/chat").on("connection", async function (socket) {
        redis.sadd(
        `user:${socket.decoded.userId}`,
        JSON.stringify({ socketId: socket.id })
        );
    
        socket.on("send_message", async function (data) {
        // emit message to the user (id)
        let socketIds = await redis.smembers(`user:${data.userId}`);
        socketIds.map((x) => {
            x = JSON.parse(x);
            io.of("/chat").to(x.socketId).emit("private_message", {
            content: data.content,
            roomId: data.roomId,
            userId: data.userId,
            });
        });
    
        // create messages and room in redis
        await redis.rpush(
            `room:${data.roomId}:messages`,
            JSON.stringify({
            userId: data.userId,
            content: data.content,
            })
        );
    
        let roomName = 'Producto no encontrado';
        try{
            let response = await axios({
            url: `${process.env.HOST_PRODUCT}/api/v1/products/${data.roomId.split("-")[2]}`,
            method: 'GET',
            timeout: 1000,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${socket.token}`
            }
            })
            if (response.data.length === 0) {
            console.log("Fallo")
            throw {status: 404, message: 'Invalid data product'}
            }
            roomName = response.data[0].name
        } catch (error) {
            console.log(error)
        }
        
        [socket.decoded.userId, data.userId].map( async (userId) => {
            await redis.set(
            `user:${userId}:room:${data.roomId}`,
            JSON.stringify({
                last_message: data.content,
                roomName: roomName,
            })
            );
    
            // cache 
            await redis.del(`cache:/v1/messenger/room:user:${userId}`);
            await redis.del(`cache:/v1/messenger/room/${data.roomId}:user:${userId}`);
        })
    
        await redis.zadd(`user:${data.userId}:room`, Date.now(), data.roomId);
        await redis.zadd(`user:${socket.decoded.userId}:room`, Date.now(), data.roomId);
        });
    
        socket.on("disconnect", () => {
        redis.srem(
            `user:${socket.decoded.userId}`,
            JSON.stringify({ socketId: socket.id })
        );
        });
    });
}  