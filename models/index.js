const { Sequelize, Op } = require('sequelize');
require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: 'localhost',
  dialect: 'postgres'
});

const db = {
  sequelize,
  Sequelize,
  User: require('./user')(sequelize, Sequelize),
  Post: require('./post')(sequelize, Sequelize),
  Comment: require('./comment')(sequelize, Sequelize),
};

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);

db.Post.hasMany(db.Comment);
db.Comment.belongsTo(db.Post);

db.User.hasMany(db.Comment);
db.Comment.belongsTo(db.User);


sequelize.sync()
  .then(() => {
    console.log('Database and tables created');
  })
  .catch((error) => {
    console.error('Error creating database and tables:', error);
  });

module.exports = db;
