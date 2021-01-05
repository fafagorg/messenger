const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const commons = require("./commons");
const Redis = require("ioredis");
const app = express();
const http = require('http').createServer(app);
const axios = require('axios');
const io = require('socket.io')(http, {
  transports: ["websocket"],
});
if (!process.env.NODE_ENV) dotenv.config();
if (process.env.NODE_ENV) dotenv.config({ path: '.env.production' })
console.log(process.env)

let password = (!process.env.NODE_ENV) ? undefined : process.env.REDIS_PASSWORD;
const redis = new Redis({
  port: process.env.REDIS_PORT, // Redis port
  host: process.env.REDIS_HOST, // Redis host
  password: password,
}) 

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(morgan("common"));
app.use((req, res, next) => {
  req.redis = redis
  next();
})
app.use("/v1/messenger/room", async (req, res, next) => {
  if (!req.headers.authorization || req.headers.authorization == undefined) {
    next(new Error("Authentication error"));
  }

  try {
    let token = req.headers.authorization.replace('Bearer ', '');
    let decoded = await commons.decodedJWT(token)
    req.decoded = decoded;
    req.decoded.token = token;
    next();
  } catch (error) {
    console.log('Authentication error: ', error)
    return res.sendStatus(403);
  }
});

// routers /
app.get('/', (req, res) => {
  return res.sendStatus(200)
})

// routers room
const roomRouter = require('./routers/room');
app.use("/v1/messenger/room", roomRouter);

// server
const port = process.env.APP_PORT || 3001;
http.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

module.exports = {app, redis};




















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
    console.log(error)
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

    var roomName = 'Producto no encontrado';
    try{
      roomName = Object.entries(await axios({
        url: `${process.env.HOST_PRODUCT}/api/products/${data.roomId.split("-")[2]}`,
        method: 'GET',
        timeout: 1000,
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${socket.token}`
        }
      }))[5][1]['name'];
      
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

