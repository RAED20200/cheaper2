import dotenv from 'dotenv';
dotenv.config({ path: `../.env` });
import { sequelize } from '../utils/connect.js';
import { DataTypes, Model } from 'sequelize';

class storeStory extends Model {}

storeStory.init(
    {
        avatar: {
            type: DataTypes.STRING(),
            allowNull: false,
        },
    },
    {
        // Other model options go here
        sequelize, // We need to pass the connection instance
        modelName: 'storeStory', // We need to choose the model name
        timestamps: false,
        freezeTableName: true, //use to save model with the name User , without set 's' at the end of name
    }
);
export default storeStory;
