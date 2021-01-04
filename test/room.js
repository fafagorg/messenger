// Import the dependencies for testing
var expect = require('chai').expect;
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../index')// Configure chai

chai.use(chaiHttp);
chai.should();

describe("Rooms", () => {
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
        it("should get room messages", (done) => {
             const roomId = '1-2-34';
          
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
        it("should not get room messages", (done) => {
             const roomId = '1-67-9888';
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
            const roomId = '2-67-9888';
            chai.request(app)
                .get(`/v1/messenger/room/${roomId}`)
                .set('Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjF9.-XWGATiWn40-XFP-yRccxl5B6rLGW-fv2auhlP5PXrE')
                .end((err, res) => {
                    res.should.have.status(401);
                    done();
                 });
        });
    });
});