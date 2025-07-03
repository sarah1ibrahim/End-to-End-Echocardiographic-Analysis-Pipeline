import { Sequelize, DataTypes } from 'sequelize';
import mysql from 'mysql'
let connection;
if (process.env.NODE_ENV === 'test') {
  connection = new Sequelize('sqlite::memory:', {
    dialect: 'sqlite',
    logging: false,
  });
} else {
  connection = new Sequelize("echocardiogram_analysis", "root", "", {
    host: 'localhost',
    dialect: 'mysql',
    // dialectModule: mysql,
    dialectOptions: {
      charset: 'utf8mb4',
    },
  });
}

connection.authenticate()
  .then(async () => {
    if (process.env.NODE_ENV !== 'test') {
      await connection.query("SET NAMES utf8mb4");
      console.log("Connected successfully");
    }
  })
  .catch((error) => {
    if (process.env.NODE_ENV !== 'test') {
      console.log("Connection failed:", error);
    }
  });

export { connection };