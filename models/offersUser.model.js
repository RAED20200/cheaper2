import dotenv from 'dotenv';
dotenv.config({ path: `../.env` });
import { sequelize } from '../utils/connect.js';
import { DataTypes, Model } from 'sequelize';
import moment from 'moment';
import { enumTakenAddOfferOrNot } from '../utils/enums.js';

class offersUser extends Model {}
offersUser.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        packsStoreId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        dataTake: { type: DataTypes.DATEONLY, allowNull: true },
        QR: {
            type: DataTypes.STRING(400),
            allowNull: true,
        },
        discount: { type: DataTypes.FLOAT, allowNull: false },

        evaluate: { type: DataTypes.INTEGER, allowNull: true },
        takenAddOfferOrNot: {
            type: DataTypes.ENUM,
            values: Object.values(enumTakenAddOfferOrNot),
            allowNull: false,
        },
        reasonSpam: {
            type: DataTypes.STRING(300),
            allowNull: true,
            validate: {
                notEmpty: {
                    msg: 'لا يمكنك ترك حقل لسبب فارغ ',
                },
            },
            set(value) {
                this.setDataValue('reasonSpam', value.trim());
            },
        },
        //* createdAt , mean from this filed i can calc the Expiry date
    },
    {
        freezeTableName: true, //use to save model with the name User , without set 's' at the end of name
        // Other model options go here
        sequelize, // We need to pass the connection instance
        modelName: 'offersUser', // We need to choose the model name
        deletedAt: 'deletedAt',
        timestamp: true,
        updatedAt: false,
        paranoid: true,
    }
);
export default offersUser;
