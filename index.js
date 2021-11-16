require('dotenv').config();
const express = require('express');
const port = process.env.PORT;

const app = express();

app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

app.use(express.json());

// Routes

app.use('/', require('./routes/buda') );
