
var express = require('express');
var router = express.Router();
const jwt = require("jsonwebtoken");
// return [
//   {
//     roomId: "1-2-3",
//     lastMessage: "Hola, que tal?",
//     user: {
//       userId: 1,
//       image:
//         "https://3.bp.blogspot.com/-7dGg2SxOnPc/W58gx5zIm3I/AAAAAAAAFCM/ov25hkvKW0I0B-qruNE4_7wP0v7tiW5sQCLcBGAs/s1600/favicon.png",
//     },
//   },
//   {
//     roomId: "1-2-4",
//     lastMessage: "Hola, que tal?",
//     user: {
//       userId: 1,
//       image:
//         "https://3.bp.blogspot.com/-7dGg2SxOnPc/W58gx5zIm3I/AAAAAAAAFCM/ov25hkvKW0I0B-qruNE4_7wP0v7tiW5sQCLcBGAs/s1600/favicon.png",
//     },
//   },
// ];

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
    room_data = JSON.parse(room_data)

    return {
      roomId: roomId,
      lastMessage: room_data.last_message,
      user: {
        userId: req.decoded.userId,
        image: 'a',
      }
    }
  });
  result = await Promise.all(result)

  res.send(result);
});

// define the about route
router.get('/about', function(req, res) {
  res.send('About birds');
});

module.exports = router;