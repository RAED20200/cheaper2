import dotenv from 'dotenv'
dotenv.config({ path: `../.env` })
import { sequelize } from '../utils/connect.js'
import { DataTypes, Model } from 'sequelize'
import moment from 'moment'

class users_Pivot_category extends Model {}

users_Pivot_category.init(
    {
        //permission id
        categoryId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        //  user id
        userId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },
    {
        freezeTableName: true, //use to save model with the name User , without set 's' at the end of name
        sequelize, // We need to pass the connection instance
        tableName: 'users_Pivot_category',
        timestamps: false,
    }
)
export default users_Pivot_category
