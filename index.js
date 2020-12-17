const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const router = new express.Router();
const commons = require("./commons");
if (!process.env.NODE_ENV) dotenv.config();



const app = express();

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);
app.use(morgan("common"));

router.use(async (req, res, next) => {
  if (!req.headers.authorization) {
    next(new Error("Authentication error"));
  }

  let token = req.headers.authorization.replace('Bearer ', '');
  try {
    let decoded = await commons.decodedJWT(token)
    console.log(decoded)
    req.decoded = decoded;
    next();
  } catch (error) {
    return res.sendStatus(403);
  }
});

// routers
const roomRouter = require('./routers/room');
app.use("v1/messenger/room", roomRouter);

// server
const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

exports.app = app;


// socket
const io = require("socket.io")(process.env.SOCKET_PORT, {
  transports: ["websocket"],
});
const jwt = require("jsonwebtoken");
const Redis = require("ioredis");
const redis = new Redis(6379, process.env.REDIS_HOST);


app.use((req, res, next) => {
  req.redis = redis
  next();
})


// Authentication middleware
io.of("/chat").use(async (socket, next) => {
  if (!(socket.handshake.query && socket.handshake.query.token)) {
    next(new Error("Authentication error"));
  }

  let token = socket.handshake.query.token.replace('Bearer ', '');
  try {
    let decoded = await commons.decodedJWT(token)
    socket.decoded = decoded;
    next();
  } catch (error) {
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
        image: null,
      });
    });

    // create messages and room in redis
    await redis.rpush(
      `room:${data.roomId}:messages`,
      JSON.stringify({ userId: data.userId, content: data.content })
    );

    [socket.decoded.userId, data.userId].map( async (userId) => {
      await redis.set(
        `user:${userId}:room:${data.roomId}`,
        JSON.stringify({
          last_message: data.content,
          product: { name: null, id: null, image: null },
        })
      );
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
