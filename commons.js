const axios = require('axios');

const decodedJWT = async (token) => {
    const response = await axios({
        url: `${process.env.HOST_AUTH}/api/v1/auth/validate`,
        method: 'POST',
        timeout: 1000,
        data: {
            token: token
        },
        headers: {
            "Content-Type": "application/json"
        }
    });
    response.data.userId = response.data.userId
    return response.data
}

exports.decodedJWT = decodedJWT;