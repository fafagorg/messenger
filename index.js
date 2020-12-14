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
const chatNamespace = io.of('/chat');
const jwt = require('jsonwebtoken');
const redis = require("redis");

const clientRedis = redis.createClient(6379, process.env.REDIS_HOST);

// Authentication middleware
io.of('/chat').use((socket, next) => {
  console.log("Aaaaaaaaaaaaaaaaaa")
  if (!(socket.handshake.query && socket.handshake.query.token)) {
    next(new Error('Authentication error'));
  }

  let token = socket.handshake.query.token
  console.log('TOKEN: ', token)
  jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
    if (err) return next(new Error('Authentication error'));
    socket.decoded = decoded;
    next();
  });    
})
// Connection authenticated 
chatNamespace.on('connection', function(socket) {
  //socket lo almacenas -> socket.decode.userId
  clientRedis.sadd(`user:${socket.decode.userId}`, {
     socketId: socket.id
  });

  socket.on('message', function(data) {
    // emit message to the user (id)
    chatNamespace.to(socketId).emit('message', data.content);
    // create messages in redis

    // modify the last message 

  });
});

chatNamespace.on('disconnect', function(socket) {
  //socket lo eliminas -> socket.decode.userId
  socket.id
});

app.get('/', (req, res) => {
  const chatNamespace = io.of('/chat');
  chatNamespace.emit('anevent', { some: 'data' });
  res.send('tttes')
})

