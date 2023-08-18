import { Op } from 'sequelize';
import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
// MODELS
import {
    category,
    offersUser,
    packsStore,
    store,
    users_Pivot_category,
} from '../../models/index.js';
import moment from 'moment';
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
            let categoryInfo = await category.findOne({
                attributes: ['id'],
                where: {
                    name: req.body.name.trim(),
                },
            });
            if (categoryInfo) throw Error(`اسم الصنف موجود من قبل`);
            //create category in db
            await category.create({ ...req.body });
            return res
                .status(StatusCodes.CREATED)
                .send({ success: true, msg: 'تمت عملية الانشاء بنجاح' });
        } catch (err) {
            return res
                .status(StatusCodes.BAD_REQUEST)
                .send({ success: false, error: err.message });
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
            // console.log(12);
            let categoryInfo = await category.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!categoryInfo) throw Error(`رقم الصنف غير صحيح `);
            categoryInfo = await category.findOne({
                attributes: ['id'],

                where: { name: req.body.name, id: { [Op.not]: req.params.id } },
            });
            if (categoryInfo) throw Error(`اسم الصنف موجود من قبل`);
            //create category in db
            await category.update(
                { ...req.body },
                { where: { id: req.params.id } }
            );
            res.status(StatusCodes.OK).send({
                success: true,
                msg: `تمت عملية التحديث بنجاح `,
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
        //if remove category then => will delete for every user interests and store has this category
        try {
            const categoryInfo = await category.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!categoryInfo) throw Error('رقم الصنف غير صحيح ');
            await categoryInfo.destroy({ force: true });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت عملية الحذف بنجاح',
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
    //get all category
    getAllCategory: async (req, res) => {
        try {
            let allCategory = await category.findAll({
                raw: true,
                attributes: { exclude: ['checkWithImageOrNot'] },
            });
            allCategory = await Promise.all(
                allCategory.map(async (myCategory) => {
                    //  ! all count user has this category
                    let allCountUser =
                        await users_Pivot_category.findAndCountAll({
                            where: { categoryId: myCategory.id },
                            raw: true,
                        });
                    //  ! all count store type of this  category

                    let allStoreCount = await store.findAndCountAll({
                        raw: true,
                        where: { categoryId: myCategory.id },
                    });
                    //  ! all count offer taken this month

                    let allOfferTaken = await offersUser.findAll({
                        raw: true,
                        attributes: [
                            [
                                Sequelize.fn(
                                    'MONTH',
                                    Sequelize.col('dataTake')
                                ),
                                'month',
                            ],
                            [
                                Sequelize.fn(
                                    'COUNT',
                                    Sequelize.col('offersUser.id')
                                ),
                                'count',
                            ],
                        ],
                        include: {
                            model: packsStore,
                            required: true,
                            attributes: [],
                            include: {
                                model: store,
                                required: true,
                                attributes: [],
                                where: { categoryId: myCategory.id },
                            },
                        },

                        where: Sequelize.literal(
                            'MONTH(dataTake)= MONTH(CURRENT_DATE())'
                        ),
                        group: 'month',
                    });
                    return {
                        name: myCategory.name,
                        nameEmo: myCategory.nameEmo,
                        count: {
                            storeCount: allStoreCount.count,
                            countUser: allCountUser.count,
                            countOfferTaken: allOfferTaken.length
                                ? allOfferTaken[0].count
                                : 0,
                        },
                    };
                })
            );
            res.status(StatusCodes.OK).send({
                success: true,
                data: allCategory,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};
