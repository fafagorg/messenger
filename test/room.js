// Import the dependencies for testing
var expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const axios = require('axios');
const {app, redis} = require('../index')
chai.use(chaiHttp);
chai.should();

describe("Rooms", () => {
    describe("", () => {
        let token;
        // Test create a room 
        it("should create a room with a message", async () => {
            let messages = await redis.rpush(
                `room:string-string2-1:messages`,
                JSON.stringify({
                  userId: 1,
                  content: 'test',
                })
              );
            let roomUser1 = await redis.set(
            `user:string:room:string-string2-1`,
                JSON.stringify({
                    last_message: 'test',
                    roomName: 'test',
                })
            );
            let roomUser2 = await redis.set(
                `user:string2:room:string-string2-1`,
                    JSON.stringify({
                        last_message: 'test',
                        roomName: 'test',
                    })
                );
            await redis.zadd(`user:string:room`, Date.now(), 'string-string2-1');
            await redis.zadd(`user:string2:room`, Date.now(), 'string-string2-1');

            expect(messages).to.not.equal(0); 
            expect(roomUser1).to.equal('OK');
            expect(roomUser2).to.equal('OK');
        });

        it("create product 1", async () => {
            // create product 0
            try{
                await axios({
                    url: `${process.env.HOST_AUTH}/api/v1/auth/register`,
                    method: 'POST',
                    timeout: 1000,
                    data: {
                        "username": "string",
                        "name": "string",
                        "surname": "string",
                        "email": "string",
                        "phone": "654343434",
                        "password": "string"
                    },
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            } catch (error) {
                console.log(error.response.data)
            }

            try{
                await axios({
                    url: `${process.env.HOST_AUTH}/api/v1/auth/register`,
                    method: 'POST',
                    timeout: 1000,
                    data: {
                        "username": "string2",
                        "name": "string2",
                        "surname": "string2",
                        "email": "string2",
                        "phone": "654343435",
                        "password": "string2"
                    },
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
            } catch (error) {
                console.log(error.response.data)
            }

            try {
                token = await axios({
                    url: `${process.env.HOST_AUTH}/api/v1/auth/login`,
                    method: 'POST',
                    timeout: 1000,
                    data: {
                        "username": "string",
                        "password": "string"
                    },
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                token = token.data.token
            } catch (error) {
                console.log(error.response.data)
            }

            try {
                let product = await axios({
                    url: `${process.env.HOST_PRODUCT}/api/products`,
                    method: 'POST',
                    timeout: 1000,
                    data: {
                        "name": "string",
                        "category": "string",
                        "price": 0,
                        "seller": 0,
                        "id": 1
                    },
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                console.log(product.data)
            } catch (error) {
                console.log(error.response.data)
            }
        });

        // Test to get all rooms of user
        it("should get all rooms of the loggued user", (done) => {
             chai.request(app)
                 .get('/v1/messenger/room/')
                 .set('Authorization', 'Bearer ' + token)
                 .end((err, res) => {
                     res.should.have.status(200);
                     done();
                  });
         });

        // Test to get the messages of the room
        it("should get room messages by id", (done) => {
            // product 1 exist 
             const roomId = 'string-string2-1';
          
             chai.request(app)
                 .get(`/v1/messenger/room/${roomId}`)
                 .set('Authorization', 'Bearer ' + token)
                 .end((err, res) => {
                     console.log(err)
                     res.should.have.status(200);
                     done();
                  });
         });
         
        // Test to get the messages of the room
        it("should not get room messages by id, product must exist", (done) => {
            // product 0 not exist
             const roomId = 'string-string2-99999999999999999999';
             chai.request(app)
                 .get(`/v1/messenger/room/${roomId}`)
                 .set('Authorization', 'Bearer ' + token)
                 .end((err, res) => {
                     res.should.have.status(404);
                     done();
                  });
         });

         // You can not access to other user room
        it("should not access to other user room", (done) => {
            const roomId = 'string0-string2-1';
            chai.request(app)
                .get(`/v1/messenger/room/${roomId}`)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                 });
        });

        // Test update a room 
        it("should update the room name", (done) => {
            const roomId = 'string-string2-1';
            chai.request(app)
                .put(`/v1/messenger/room/${roomId}`)
                .set('Authorization', 'Bearer ' + token)
                .send({roomName: 'update room name'})
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
        // Test update a room 
        it("should not update the room name. You can only update your rooms", (done) => {
            const roomId = 'string0-string2-1';
            chai.request(app)
                .put(`/v1/messenger/room/${roomId}`)
                .set('Authorization', 'Bearer ' + token)
                .send({roomName: 'update room name'})
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });

        // Test delete a room 
        it("should delete a room", (done) => {
            const roomId = 'string-string2-1';
            chai.request(app)
                .delete(`/v1/messenger/room/${roomId}`)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                 });
        });
        // Test delete a room 
        it("should not delete a room. You can only delete your rooms", (done) => {
            const roomId = 'string0-string2-1';
            chai.request(app)
                .delete(`/v1/messenger/room/${roomId}`)
                .set('Authorization', 'Bearer ' + token)
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                 });
        });
    });
});