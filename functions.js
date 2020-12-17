const axios = require('axios');

const decodedJWT = async (token) => {
    return await axios.post(`${process.env.HOST_AUTH}/api/v1/auth/validate`, {
        token: token
    });
}

exports.decodedJWT = decodedJWT;