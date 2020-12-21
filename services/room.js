
exports.getRoom = async function(userId, redis) {
  let roomsIds = await redis.zrevrangebyscore(`user:${userId}:room`, "+inf", "-inf");
  
  let result = roomsIds.map( async (roomId) => {
    let room_data = await redis.get(`user:${userId}:room:${roomId}`); 
    room_data = JSON.parse(room_data)

    return {
      roomId: roomId,
      roomName: room_data.roomName,
      lastMessage: room_data.last_message,
    }
  });
  result = await Promise.all(result)

  return result;
};

exports.getRoomById = async function(roomId, userId, redis) {
  let messages = await redis.lrange(`room:${roomId}:messages`, 0, -1);
  if (messages.length == 0) {
    return res.status(404).send({})
  }

  messages = messages.map((x) => {
    x = JSON.parse(x)
    return {
      content: x.content,
      userId: x.userId,
    }
  })

  let room_data = await redis.get(`user:${userId}:room:${roomId}`); 
  room_data = JSON.parse(room_data)
  return {
    roomId: roomId,
    roomName: room_data.roomName,
    messages: messages
  };
};

exports.deleteRoomById = async function(roomId, userId, redis) {
  let recipientUserId = (roomId.split("-")[0] == userId) ? roomId.split('-')[1] : roomId.split("-")[0];

  await redis.del(`room:${roomId}:messages`);

  await redis.del(`user:${recipientUserId}:room:${roomId}`);
  await redis.zrem(`user:${recipientUserId}:room`, roomId);
  
  await redis.del(`user:${userId}:room:${roomId}`);
  await redis.zrem(`user:${userId}:room`, roomId);

};

exports.updateRoomName = async function(roomId, userId, roomName, redis) {
  let room = await redis.get(`user:${userId}:room:${roomId}`);
  let data = JSON.parse(room)
  data.roomName = roomName;
  await redis.set(`user:${userId}:room:${roomId}`, JSON.stringify(data));
};