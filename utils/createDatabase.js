import dotenv from 'dotenv'

dotenv.config({ path: `./.env` })
import { Sequelize } from 'sequelize'
import { sequelize as sequelizeConnect } from '../utils/connect.js'

export default () => { 
    // create sequelize connection with mysql
    const sequelize = new Sequelize(
        `mysql://${process.env.USER}:${process.env.PASSWORD}@${process.env.HOST}:${process.env.PORT_DB}`,
        {
            dialect: 'mysql',
            logging: false, // تعطيل الرسائل التي تظهر في الطرفية
        }
    )
    //! create database cheaper if not exists
    sequelize
        .query(`CREATE DATABASE IF NOT EXISTS ${process.env.DATABASE}`)
        .then(async (result) => {
            if (result[0].affectedRows) {

                   // if affectRows is above the 0 then now is created new database now
                //  import every model
                await import(`../models/index.js`)

                let defaultData = await import('./default_data.js')
                await sequelizeConnect.sync({ force: true }).then(async () => {
                    await defaultData.default(sequelizeConnect).then((_) => {
                        console.log(
                            'successfully ✅ create cheaper database ✅✅'
                        )
                    })
                })
            }
        })
        .catch((err) => {
            console.error(
                `Error creating database: ${process.env.DATABASE} `,
                err
            )
        })
}
