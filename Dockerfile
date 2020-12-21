FROM node:15.3.0-alpine3.10

WORKDIR /usr/app

COPY . .
RUN npm install

CMD ["node", "index.js"]
