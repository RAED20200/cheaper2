import moment from 'moment';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

//MODELS
import { offersUser, store, user } from '../../models/index.js';
import { Op, Sequelize } from 'sequelize';

export default {
    getCount: async (req, res) => {
        try {
            let response = {};
            let countUser = await user.findAll({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                raw: true,
                group: 'roleId',
                paranoid: false,
                where: { roleId: 2 },
            });
            let countStore = await store.findAndCountAll();

            let countBuyOffer = await offersUser.findAll({
                raw: true,
                attributes: [
                    [Sequelize.fn('MONTH', Sequelize.col('dataTake')), 'month'],
                    [
                        Sequelize.fn('COUNT', Sequelize.col('offersUser.id')),
                        'count',
                    ],
                ],
                where: Sequelize.literal(
                    'MONTH(dataTake)= MONTH(CURRENT_DATE())'
                ),
                group: 'month',
            });
            response = {
                countUser: countUser.length ? countUser[0].count : 0,
                countStore: countStore.count,
                countBuyOffer: countBuyOffer.length
                    ? countBuyOffer[0].count
                    : 0,
            };

            res.status(StatusCodes.OK).send({ success: true, data: response });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
};
