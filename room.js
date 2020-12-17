
const express = require('express');
const router = express.Router();
const commons = require("./commons");

// get rooms logued user
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
})

router.get('/', async function(req, res) {
  let roomsIds = await req.redis.zrevrangebyscore(`user:${req.decoded.userId}:room`, "+inf", "-inf");
  
  let result = roomsIds.map( async (roomId) => {
    let room_data = await req.redis.get(`user:${req.decoded.userId}:room:${roomId}`); 
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

  res.status(200).send(result);
});

router.get('/:id', async function(req, res) {
  let roomId = req.params.id

  if (!(roomId.split("-")[0] == req.decoded.userId || roomId.split("-")[1] == req.decoded.userId)) {
    return res.status(401).send("Invalid params, You cannot access other users' rooms ");
  }

  let messages = await req.redis.lrange(`room:${roomId}:messages`, 0, -1);
  messages = messages.map((x) => {
    x = JSON.parse(x)
    return {
      content: x.content,
      userId: x.userId,
      images: null,
    }
  })

  res.status(200).send({
    roomId: roomId,
    user: {
      userId: req.decoded.userId,
      name: null,
      image: null
    },
    messages: messages
  });
});

module.exports = router;