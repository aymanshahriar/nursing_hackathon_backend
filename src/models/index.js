import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// Define paths & environment settings
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const configFile = (await import('../config/config.js')).default;
const config = configFile[env];

const db = {};

// Initialize Sequelize instance
const sequelize = config.use_env_variable
    ? new Sequelize(process.env[config.use_env_variable], config)
    : new Sequelize(config.database, config.username, config.password, config);

// Function to initialize models
const initializeModels = async () => {
    const files = fs.readdirSync(__dirname).filter(file =>
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1
    );

    for (const file of files) {
        const modelPath = pathToFileURL(path.join(__dirname, file)).href;
        const modelModule = await import(modelPath);
        const model = modelModule.default(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    }

    // Setup model associations
    Object.keys(db).forEach(modelName => {
        if (db[modelName].associate) {
            db[modelName].associate(db);
        }
    });

    console.log('✅ Loaded models:', Object.keys(db));
};

// Function to initialize the database
const initializeDatabase = async () => {
    await initializeModels();
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;

    // try {
    //     await sequelize.authenticate();
    //     console.log('✅ Database connection successful');
    //     await sequelize.sync({ alter: true }); // Auto-migrate schema changes
    //     console.log('✅ Database & tables synced');
    // } catch (error) {
    //     console.error('❌ Database connection error:', error);
    // }
};

// Initialize everything before exporting
await initializeDatabase();

export default db;
