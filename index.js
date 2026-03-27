require('dotenv').config();
const express = require('express');
const port = process.env.PORT || 8080;
const cors = require('cors');

const app = express();

app.set('trust proxy', true);

// CORS
app.use(cors());

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Listening at port ${port}`);
  });
}

app.use(express.json());

// Routes

app.use('/', require('./routes/buda'));

module.exports = app;
