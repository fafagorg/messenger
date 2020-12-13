FROM node:15.3.0-alpine3.10

WORKDIR /node-api
COPY . .
RUN npm install
ENTRYPOINT node index.js
