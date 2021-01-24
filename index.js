const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const commons = require("./commons");
const Redis = require("ioredis");
const app = express();
const http = require('http').createServer(app);
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const socket = require('./controllers/socket');
const axios = require('axios');
const io = require('socket.io')(http, {
  transports: ["websocket"],
});
if (!process.env.NODE_ENV) dotenv.config();
if (process.env.NODE_ENV) dotenv.config({ path: '.env.production' })

// swagger
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const redis = new Redis({
  port: process.env.REDIS_PORT, // Redis port
  host: process.env.REDIS_HOST, // Redis host
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
    console.log(token)
    let decoded = await commons.decodedJWT(token)
    console.log(decoded)
    req.decoded = decoded;
    req.decoded.token = token;
    next();
  } catch (error) {
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

// socket
socket.socket(io, redis, axios)

module.exports = {app, redis};


