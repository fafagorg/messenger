// Import the dependencies for testing
var expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const {app, redis} = require('../index')
chai.use(chaiHttp);
chai.should();

describe("Rooms", () => {
    describe("POST ", () => {
        // Test create a room 
        it("should create a room with a message", async () => {
            let messages = await redis.rpush(
                `room:1-2-1:messages`,
                JSON.stringify({
                  userId: 1,
                  content: 'test',
                })
              );
            let roomUser1 = await redis.set(
            `user:1:room:1-2-1`,
                JSON.stringify({
                    last_message: 'test',
                    roomName: 'test',
                })
            );
            let roomUser2 = await redis.set(
                `user:2:room:1-2-1`,
                    JSON.stringify({
                        last_message: 'test',
                        roomName: 'test',
                    })
                );
            await redis.zadd(`user:1:room`, Date.now(), '1-2-1');
            await redis.zadd(`user:2:room`, Date.now(), '1-2-1');

            expect(messages).to.not.equal(0); 
            expect(roomUser1).to.equal('OK');
            expect(roomUser2).to.equal('OK');
        });
    });
    describe("GET ", () => {
        // Test to get all rooms of user
        it("should get all rooms of the loggued user", (done) => {
             chai.request(app)
                 .get('/v1/messenger/room/')
                 .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                 .end((err, res) => {
                     res.should.have.status(200);
                     done();
                  });
         });        
        // Test to get the messages of the room
        it("should get room messages by id", (done) => {
            // product 1 exist 
             const roomId = '1-2-1';
          
             chai.request(app)
                 .get(`/v1/messenger/room/${roomId}`)
                 .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                 .end((err, res) => {
                     console.log(err)
                     res.should.have.status(200);
                     done();
                  });
         });
         
        // Test to get the messages of the room
        it("should not get room messages by id, product must exist", (done) => {
            // product 0 not exist
             const roomId = '1-2-0';
             chai.request(app)
                 .get(`/v1/messenger/room/${roomId}`)
                 .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                 .end((err, res) => {
                     res.should.have.status(404);
                     done();
                  });
         });

         // You can not access to other user room
        it("should not access to other user room", (done) => {
            const roomId = '3-2-34';
            chai.request(app)
                .get(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                 });
        });
    });
    describe("PUT ", () => {
        // Test update a room 
        it("should update the room name", (done) => {
            const roomId = '1-2-1';
            chai.request(app)
                .put(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .send({roomName: 'update room name'})
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });
        // Test update a room 
        it("should not update the room name. You can only update your rooms", (done) => {
            const roomId = '3-2-1';
            chai.request(app)
                .put(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .send({roomName: 'update room name'})
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                });
        });
    });
    describe("DELETE ", () => {
        // Test delete a room 
        it("should delete a room", (done) => {
            const roomId = '1-2-1';
            chai.request(app)
                .delete(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                 });
        });
        // Test delete a room 
        it("should not delete a room. You can only delete your rooms", (done) => {
            const roomId = '3-2-1';
            chai.request(app)
                .delete(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                 });
        });
    });
});