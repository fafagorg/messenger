const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
if (!process.env.NODE_ENV) dotenv.config();


const app = express();

// middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(
    cors({
      origin: '*',
    }),
);
app.use(morgan('common'));

// server
const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

exports.app = app;








// socket
const io = require('socket.io')(process.env.SOCKET_PORT, {transports: ['websocket']});
const jwt = require('jsonwebtoken');
const redis = require("redis");

const clientRedis = redis.createClient(6379, process.env.REDIS_HOST);

// Authentication middleware
io.of('/chat').use((socket, next) => {
  if (!(socket.handshake.query && socket.handshake.query.token)) {
    next(new Error('Authentication error'));
  }

  let token = socket.handshake.query.token
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) return next(new Error('Authentication error'));
    socket.decoded = decoded;
    next();
  });    
})

// Connection authenticated 
 io.of('/chat').on('connection', function(socket) {
  clientRedis.sadd(`user:${socket.decoded.userId}`, JSON.stringify({ socketId: socket.id }));

  socket.on('message', function(data) {
    // emit message to the user (id)
    let socketIds = clientRedis.smembers(`user:${data.userId}`);
    socketIds.map(x => {
       io.of('/chat').to(x.socketId).emit('message', data.content);
    });

    // create messages in redis

    // modify the last message 

  });

  socket.on('disconnect', () => {
   clientRedis.srem(`user:${socket.decoded.userId}`, JSON.stringify({ socketId: socket.id }));
  });
});

