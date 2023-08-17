// config.js
const config = {
    app: {
      port: 3000
    },
    db: {
      host: 'mongodb://127.0.0.1:27017/todolistDB',
      port: 27017,
      name: 'todolistDB'
    }
   };
   
module.exports = config;
