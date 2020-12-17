
exports.getRoom = async function(userId, redis) {
  let roomsIds = await redis.zrevrangebyscore(`user:${userId}:room`, "+inf", "-inf");
  
  let result = roomsIds.map( async (roomId) => {
    let room_data = await redis.get(`user:${userId}:room:${roomId}`); 
    room_data = JSON.parse(room_data) || {}

    return {
      roomId: roomId,
      lastMessage: room_data.last_message || null,
      user: {
        userId: userId,
        image: null,
      }
    }
  });
  result = await Promise.all(result)

  return result;
};

exports.getRoomById = async function(roomId, userId, redis) {
  let messages = await redis.lrange(`room:${roomId}:messages`, 0, -1);
  messages = messages.map((x) => {
    x = JSON.parse(x)
    return {
      content: x.content,
      userId: x.userId,
      images: null,
    }
  })

  return {
    roomId: roomId,
    user: {
      userId: userId,
      name: null,
      image: null
    },
    messages: messages
  };
};
