const mongoose = require('mongoose');
const debug = require('debug')('app:db');
const logger = require('./logger');

const connectDB = async () => {
  try {
    debug('Connexion à MongoDB en cours...');
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connexion à MongoDB établie.');
  } catch (err) {
    logger.error('Erreur de connexion à MongoDB.', { error: err.message });
    process.exit(1);
  }
};

module.exports = connectDB;
