const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

// middleware
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(
    cors({
      origin: '*',
    }),
);
app.use(morgan('common'));

// server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

exports.app = app;
