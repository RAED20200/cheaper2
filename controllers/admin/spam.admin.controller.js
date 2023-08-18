import { Sequelize } from 'sequelize';
import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
// MODELS
import { user, store } from '../../models/index.js';

export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    AllSpamsForStore: async (req, res) => {
        try {
            let allSpams = await spams.findAll({
                attributes: ['reason', ['createdAt', 'dateAt'], 'id'],
                include: [
                    {
                        model: user,
                        required: true,
                        attributes: [
                            'name',
                            'username',
                            'phoneNumber',
                            'gender',
                            'birthday',
                        ],
                    },
                    {
                        model: offer,
                        required: true,
                        include: {
                            model: store,
                            attributes: [],
                            required: true,
                            where: { nameStore: req.body.nameStore.trim() },
                        },
                        attributes: [],
                    },
                ],
            });

            res.status(StatusCodes.OK).send({ success: true, data: allSpams });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    AllStoreAndCount: async (req, res) => {
        try {
            let all = await spams.findAll({
                include: {
                    model: offer,
                    attributes: ['id'],
                    required: true,
                    include: {
                        model: store,
                        required: true,
                        attributes: [
                            'nameStore',
                            'avatar',
                            'latitude',
                            'longitude',
                        ],
                    },
                },
                attributes: [
                    [Sequelize.fn('count', Sequelize.col('offerId')), 'count'],
                ],
                group: ['offerId'],
            });

            res.status(StatusCodes.OK).send({ success: true, data: all });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
};
