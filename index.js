const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');


const cache = require('./middlewares/cache');
const { createIndex } = require('./utils/elasticsearch');
const { Client } = require('@elastic/elasticsearch');

const crypto = require('crypto');
const secret = crypto.randomBytes(32).toString('hex');
require('dotenv').config()
require('./config/passport')(passport);

const client = new Client({ node: process.env.ELASTIC_NODE });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(apiLimiter);
//app.use(cache)
app.use(passport.initialize());
app.use(passport.session());

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blogging Platform API',
      version: '1.0.0',
      description: 'A simple API for managing a blogging platform',
    },
  },
  apis: ['./routes/*.js'], // Point to your API routes
};

const specs = swaggerJsdoc(options);
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

//createIndex();

const userRoutes = require('./routes/users')(passport);
const postRoutes = require('./routes/posts')(passport);
const commentRoutes = require('./routes/comments')(passport);

app.use('/users', userRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

module.exports = {
  client
};
