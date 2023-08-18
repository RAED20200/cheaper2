import { Op } from 'sequelize';
import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
// MODELS
import { packs, packsStore } from '../../models/index.js';
import Sequelize from 'sequelize';
export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //create
    create: async (req, res) => {
        try {
            let pack = await packs.findOne({
                attributes: ['id'],
                where: {
                    name: req.body.name.trim(),
                },
            });
            if (pack)
                throw Error(
                    `اسم الباقة   \'${req.body.name.trim()}\' موجود من قبل `
                );
            //create Pack in db
            await packs.create({ ...req.body });
            res.status(StatusCodes.CREATED).send({
                success: true,
                msg: `تم انشاء الباقة بنجاح `,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //update
    update: async (req, res) => {
        try {
            let pack = await packs.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!pack) throw Error(`رقم الباقة غير صحيح `);
            pack = await packs.findOne({
                attributes: ['id'],
                where: { name: req.body.name, id: { [Op.not]: req.params.id } },
            });

            if (pack) throw Error(`اسم الباقة موجود من قبل`);

            //create category in db
            await packs.update(
                { ...req.body },
                { where: { id: req.params.id } }
            );
            res.status(StatusCodes.OK).send({
                success: true,
                msg: `تم تحديث الباقة بنجاح `,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //remove
    remove: async (req, res) => {
        //if remove category then => will delete for every user interests
        try {
            if (req.params.id == 1)
                throw Error(
                    'لا يمكنك اجراء عملية الحذف لان الباقة هي الباقة الافتراضية '
                );
            const pack = await packs.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!pack) throw Error('رقم الباقة غير صحيح ');

            await pack.destroy({ force: true });
            return res
                .status(StatusCodes.OK)
                .send({ success: true, msg: 'تمت عملية الحذف بنجاح ' });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //get all category
    getAllPacks: async (req, res) => {
        try {
            let allPack = await packs.findAll({
                raw: true,
                attributes: ['name', 'duration', 'price', 'id'],
            });
            res.status(StatusCodes.OK).send({ success: true, data: allPack });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    chartPack: async (req, res) => {
        try {
            let allPack = await packs.findAll({
                raw: true,
                attributes: ['id', 'name', 'duration', 'price'],
            });

            allPack = await Promise.all(
                allPack.map(async (myPack) => {
                    let packWithCount = await packsStore.findAll({
                        raw: true,
                        attributes: [
                            [
                                Sequelize.fn('COUNT', Sequelize.col('id')),
                                'count',
                            ],
                            [
                                Sequelize.fn(
                                    'MONTH',
                                    Sequelize.col('createdAt')
                                ),
                                'month',
                            ],
                        ],
                        group: 'month',
                        order: [[Sequelize.col('month', 'ASC')]],
                        where: { packId: myPack.id },
                    });

                    return {
                        ...myPack,
                        allMonthWithCount: packWithCount,
                    };
                })
            );
            res.status(StatusCodes.OK).send({ success: true, data: allPack });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};
