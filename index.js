require('dotenv').config();
const express = require('express');
const port = process.env.PORT;
const cors = require('cors');

const app = express();

// CORS
app.use(cors());

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

app.use(express.json());

// Routes

app.use('/', require('./routes/buda'));
