const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
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

// Authentication middleware
io.of("/chat").use((socket, next) => {
  if (!(socket.handshake.query && socket.handshake.query.token)) {
    next(new Error("Authentication error"));
  }

  let token = socket.handshake.query.token;
  jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
    if (err)
      return next(new Error("Authenticnpm install -g eslintation error"));
    socket.decoded = decoded;
    next();
  });
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
      JSON.stringify({ userId: data.userId, message_content: data.content })
    );

    await redis.zadd(
      `user:${socket.decoded.userId}:${data.roomId}`,
      Date.now(),
      JSON.stringify({
        last_message: data.content,
        product: { name: null, id: null, image: null },
      })
    );
    await redis.zadd(
      `user:${data.userId}:${data.roomId}`,
      Date.now(),
      JSON.stringify({
        last_message: data.content,
        product: { name: null, id: null, image: null },
      })
    );

    await redis.sadd(`user:${data.userId}:room`, data.roomId);
    await redis.sadd(`user:${socket.decoded.userId}:room`, data.roomId);
  });

  socket.on("disconnect", () => {
    redis.srem(
      `user:${socket.decoded.userId}`,
      JSON.stringify({ socketId: socket.id })
    );
  });
});
