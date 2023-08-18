import dotenv from 'dotenv';
dotenv.config({ path: `../.env` });
import { sequelize } from '../utils/connect.js';
import { DataTypes, Model } from 'sequelize';
import moment from 'moment';
import { enumWithImageOrNot } from '../utils/enums.js';

class category extends Model {}

category.init(
    {
        name: {
            type: DataTypes.STRING(150),
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "name country  can't be empty here ",
                },
            },
            set(value) {
                this.setDataValue('name', value.trim());
            },
        },
        checkWithImageOrNot: {
            type: DataTypes.ENUM,
            values: Object.values(enumWithImageOrNot),
            allowNull: false,
        },
        nameEmo: { type: DataTypes.STRING, allowNull: true },
    },
    {
        freezeTableName: true, //use to save model with the name User , without set 's' at the end of name
        sequelize, // We need to pass the connection instance
        tableName: 'category',
        timestamps: false,

        //! Trigger
        // when we delete the category sequelize automatic delete every user has this category and
        // delete every store has this category ,when delete store then would delete manger store
    }
);
export default category;
