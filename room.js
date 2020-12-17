
var express = require('express');
var router = express.Router();
const jwt = require("jsonwebtoken");

// get rooms logued user
router.use((req, res, next) => {
  if (!req.headers.authorization) {
    res.sendStatus(401);
  }

  let token = req.headers.authorization.replace('Bearer ', '');
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.decoded = decoded;
    next();
  });
})

router.get('/', async function(req, res) {
  let roomsIds = await req.redis.zrevrangebyscore(`user:${req.decoded.userId}:room`, "+inf", "-inf");
  
  let result = roomsIds.map( async (roomId) => {
    let room_data = await req.redis.get(`user:${req.decoded.userId}:room:${roomId}`); // mirar si al no poner rango devuelve todo ordenado y como una lista
    room_data = JSON.parse(room_data) || {}

    return {
      roomId: roomId,
      lastMessage: room_data.last_message || null,
      user: {
        userId: req.decoded.userId,
        image: null,
      }
    }
  });
  result = await Promise.all(result)

  res.send(result);
});

router.get('/:id', async function(req, res) {
  let roomId = req.params.id
  let messages = await req.redis.lrange(`room:${roomId}:messages`, 0, -1);
  messages = messages.map((x) => {
    x = JSON.parse(x)
    return {
      content: x.content,
      userId: x.userId,
      images: null,
    }
  })

  res.send({
    roomId: roomId,
    user: {
      userId: req.decoded.userId,
      name: null,
      image: null
    },
    messages: messages
  });
});

// define the about route
router.get('/about', function(req, res) {
  res.send('About birds');
});

module.exports = router;