import { Op } from 'sequelize';
import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
// MODELS
import {
    role,
    store,
    user,
    category,
    storeStory,
    blockUser,
    offersUser,
    block,
} from '../../models/index.js';
import Sequelize from 'sequelize';
import moment from 'moment';
import { enumGender } from '../../utils/enums.js';
import controlUser from '../users.controllers.js';
import { removePic } from '../../utils/helper.js';
import { bcrypt } from '../../utils/bcrypt.js';
import path from 'path';
/*
///basic roles in system :
  1 Admin 
  2 User
  3 Manger saved
  4 Manger new 
  5 manger country 
#this roles can't any one edit or delete them 
#but other role can edit on it 
*/
export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    statisticsInfo: async (req, res) => {
        try {
            let response = {};
            let userFound = await user.findOne({
                raw: true,
                where: { roleId: 2 },
            });
            let genderStatistics = {};
            let countGender;
            //! Classification Gender
            if (userFound) {
                countGender = await user.findAll({
                    raw: true,
                    attributes: [
                        'gender',
                        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                    ],
                    group: 'gender',
                    orderBy: 'gender',
                    where: { roleId: 2 },
                });
                if (countGender.length == 1) {
                    if (countGender[0]['gender'] === enumGender.FEMALE) {
                        genderStatistics = {
                            female: countGender[0]['count'],
                            male: 0,
                        };
                    } else {
                        genderStatistics = {
                            female: 0,
                            male: countGender[0]['count'],
                        };
                    }
                } else if (countGender.length == 2) {
                    genderStatistics = {
                        female:
                            countGender[0]['gender'] == enumGender.FEMALE
                                ? countGender[0]['count']
                                : countGender[1]['count'],
                        male:
                            countGender[1]['gender'] == enumGender.MALE
                                ? countGender[1]['count']
                                : countGender[0]['count'],
                    };
                }
                genderStatistics = {
                    male:
                        (genderStatistics.male /
                            (genderStatistics.female + genderStatistics.male)) *
                        100,
                    female:
                        (genderStatistics.female /
                            (genderStatistics.female + genderStatistics.male)) *
                        100,
                };
            } else {
                genderStatistics = { male: 0, female: 0 };
            }
            //! ageWithCount
            let ageWithCount = await user.findAll({
                raw: true,
                attributes: [
                    [Sequelize.fn('YEAR', Sequelize.col('birthday')), 'age'],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                group: 'age',
                paranoid: false,
                order: [[Sequelize.col('age', 'ASC')]],
                where: { birthday: { [Op.not]: null }, roleId: 2 },
            });
            ageWithCount = ageWithCount.map((userInfo) => {
                return { ...userInfo, age: moment().year() - userInfo.age };
            });

            //! countBlockUser
            let countBlockUser = await blockUser.findAndCountAll({
                raw: true,
                attributes: ['id'],
                include: {
                    model: user,
                    required: true,
                    attributes: [],
                    where: { roleId: 2 },
                },
                where: { unblock_date: { [Op.is]: null } },
            });
            response = {
                countGender: genderStatistics,
                ageWithCount,
                countBlockUser: countBlockUser.count,
            };
            res.status(StatusCodes.OK).send({ success: true, data: response });
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
    getUsers: async (req, res) => {
        try {
            const { page, size } = req.query;
            let allUser = await user.findAll({
                limit: +size,
                offset: (+page - 1) * +size,
                raw: true,
                paranoid: false,
                attributes: [
                    'id',
                    'name',
                    'username',
                    'phoneNumber',
                    'gender',
                    'avatar',
                    'birthday',
                ],
                where: { roleId: 2 },
            });

            let result = await Promise.all(
                allUser.map(async (userInfo) => {
                    let checkIfBlocked = (await blockUser.findOne({
                        raw: true,
                        attributes: ['id'],
                        where: { userId: userInfo.id },
                    }))
                        ? true
                        : false;

                    let dateLastOffer = await offersUser.findOne({
                        raw: true,
                        attributes: ['id', 'createdAt'],
                        where: { userId: userInfo.id },
                    });
                    let active = false;
                    if (dateLastOffer) {
                        const now = moment();
                        const asDay = now.diff(
                            dateLastOffer.createdAt,
                            'day',
                            true
                        );
                        active = asDay < 7 ? true : false;
                    }
                    // console.log(userInfo, checkIfBlocked, active);
                    return {
                        userInfo,
                        checkIfBlocked,
                        active,
                    };
                })
            );

            res.status(StatusCodes.OK).send({ success: true, data: result });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    getUsersAndFilterAndSearch: async (req, res) => {
        try {
            const { page, size, gender, blocked, search, active } = req.query;

            let conditionGender = {};
            if (gender) conditionGender = { gender };
            let conditionSearch = {};
            if (search)
                conditionSearch = {
                    [Op.or]: [
                        { username: { [Op.like]: `%${search}%` } },
                        { name: { [Op.like]: `%${search}%` } },
                    ],
                };

            let conditionBlock = {};

            if (blocked != undefined && blocked == 'true')
                conditionBlock = { unblock_date: { [Op.is]: null } };
            else if (blocked != undefined && blocked == 'false')
                conditionBlock = { unblock_date: { [Op.not]: null } };

            let allUser = await user.findAll({
                limit: +size,
                offset: (+page - 1) * +size,
                raw: true,
                paranoid: false,
                attributes: [
                    'id',
                    'name',
                    'username',
                    'phoneNumber',
                    'gender',
                    'avatar',
                    'birthday',
                ],
                where: {
                    roleId: 2,
                    ...conditionGender,
                    ...conditionSearch,
                },
            });
            let result = await Promise.all(
                allUser.map(async (userInfo) => {
                    let checkIfBlocked = (await blockUser.findOne({
                        raw: true,
                        paranoid: false,
                        attributes: ['id'],
                        where: { userId: userInfo.id, ...conditionBlock },
                    }))
                        ? true
                        : false;

                    let dateLastOffer = await offersUser.findOne({
                        raw: true,
                        attributes: ['id', 'createdAt'],
                        where: { userId: userInfo.id },
                    });
                    let isActive = false;
                    if (dateLastOffer) {
                        const now = moment();
                        const asDay = now.diff(
                            dateLastOffer.createdAt,
                            'day',
                            true
                        );
                        isActive = asDay < 7 ? true : false;
                    }

                    //this condition for  return value
                    if (conditionBlock.unblock_date) {
                        if (blocked == 'true' && checkIfBlocked == true) {
                            if (active != null) {
                                if (active == 'true' && isActive == true)
                                    return {
                                        userInfo,
                                        checkIfBlocked,
                                        active,
                                    };
                                else if (active == 'false' && isActive == false)
                                    return {
                                        userInfo,
                                        checkIfBlocked,
                                        active,
                                    };
                            } else
                                return {
                                    userInfo,
                                    checkIfBlocked,
                                    active,
                                };
                        } else if (
                            blocked == 'false' &&
                            checkIfBlocked == false
                        ) {
                            if (active != null) {
                                if (active == 'true' && isActive == true)
                                    return {
                                        userInfo,
                                        checkIfBlocked,
                                        active,
                                    };
                                else if (active == 'false' && isActive == false)
                                    return {
                                        userInfo,
                                        checkIfBlocked,
                                        active,
                                    };
                            } else
                                return {
                                    userInfo,
                                    checkIfBlocked,
                                    active,
                                };
                        }
                    } else {
                        if (active != null) {
                            if (active == 'true' && isActive == true)
                                return {
                                    userInfo,
                                    checkIfBlocked,
                                    active,
                                };
                            else if (active == 'false' && isActive == false)
                                return {
                                    userInfo,
                                    checkIfBlocked,
                                    active,
                                };
                        } else
                            return {
                                userInfo,
                                checkIfBlocked,
                                active,
                            };
                    }
                })
            );

            result = result.filter((e) => e !== undefined);
            res.status(StatusCodes.OK).send({ success: true, data: result });
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
    deleteUser: async (req, res) => {
        try {
            if (req.params.id === 1)
                throw Error('لا يمكنك اجراء عملية الحذف لمدير الموقع الاساسي');
            let destroyUser = await user.findOne({
                where: { id: req.params.id, roleId: 2 },
            });
            if (!destroyUser) throw Error('المستخدم المحدد غير موجودة');

            await destroyUser.destroy({ force: true });
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
    updateUser: async (req, res) => {
        try {
            if (req.params.id === 1)
                throw Error(
                    'لا يمكنك اجراء عملية التعديل لمدير الموقع الاساسي'
                );
            let updateUser = await user.findOne({
                attributes: ['id', 'avatar'],
                where: { id: req.params.id, roleId: 2 },
            });
            if (!updateUser) throw Error('المستخدم المحدد غير موجودة');

            //check value
            let userInfo = await user.findOne({
                attributes: ['id', 'avatar'],
                where: {
                    id: { [Op.ne]: updateUser.id },
                    username: req.body.username.trim(),
                },
                paranoid: false,
            });
            if (userInfo) throw Error('اسم المستخدم موجود مسبقاً');

            userInfo = null;

            //update interests
            let { error } = await controlUser.setInterests(req, updateUser);
            if (error) throw Error(error);

            if (req.body.password !== '')
                userInfo = { ...req.body, password: bcrypt(req.body.password) };
            else userInfo = { ..._.omit(req.body, ['password']) };

            // for image
            let avatarLink = null;
            if (req.file && updateUser.avatar) {
                // should update with new image
                avatarLink = process.env.LINK + `/images/${req.file.filename}`;

                // delete image recent
                let str = updateUser.avatar;
                let serverIndex = str.indexOf('/images/');
                removePic(
                    path.join(path.resolve(), str.substring(serverIndex))
                );
            } else if (req.file && !updateUser.avatar) {
                avatarLink = process.env.LINK + `/images/${req.file.filename}`;

                //should  store image
            } else if (!req.file && updateUser.avatar) {
                // delete image recent
                let str = updateUser.avatar;
                let serverIndex = str.indexOf('/images/');
                removePic(
                    path.join(path.resolve(), str.substring(serverIndex))
                );
                avatarLink = null;
            } else if (!req.file & !updateUser.avatar) {
                // don't do any things
                avatarLink = null;
            }

            await user.update(
                {
                    ...userInfo,
                    avatar: avatarLink,
                },
                { where: { id: updateUser.id } }
            );

            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت العملية بنجاح',
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
    search: async (req, res) => {
        try {
            let myUser = await user.findOne({
                where: {
                    username: { [Op.like]: `%${req.body.username.trim()}%` },
                },
                attributes: { exclude: ['password'] },
                raw: true,
            });
            if (!myUser) throw Error('اسم المستخدم غير صحيح ');
            // console.log(myUser);
            let storeInfo = null;
            if (myUser.roleId == 3) {
                // console.log(1);
                storeInfo = await store.findOne({
                    attributes: { exclude: ['userId'] },
                    order: [['nameStore', 'ASC']],
                    where: { userId: myUser.id },
                    include: {
                        model: category,
                        attributes: ['name'],
                        required: true,
                    },
                });
            }

            res.status(StatusCodes.OK).send({
                success: true,
                data: myUser,
                storeInfo,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    blockUser: async (req, res) => {
        try {
            let userCheck = await user.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.query.userId, roleId: 2 },
            });
            if (!userCheck) throw Error('المستخدم المحدد غير موجود');

            let blocCheck = await block.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.query.blockId },
            });
            if (!blocCheck) throw Error('نوع الحظر المحدد غير موجود');

            if (
                await blockUser.findOne({
                    raw: true,
                    attributes: ['id'],
                    where: {
                        userId: +req.query.userId,
                        blockId: +req.query.blockId,
                    },
                })
            )
                throw Error('هذا المستخدم محظور في هذا لنوع من الحظر ');

            await blockUser.create({
                userId: +req.query.userId,
                blockId: +req.query.blockId,
            });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت العملية بنجاح',
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    unBlockUser: async (req, res) => {
        try {
            let userCheck = await user.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.query.userId, roleId: 2 },
            });
            if (!userCheck) throw Error('المستخدم المحدد غير موجود');

            let blocCheck = await block.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.query.blockId },
            });
            if (!blocCheck) throw Error('نوع الحظر المحدد غير موجود');

            if (
                !(await blockUser.findOne({
                    raw: true,
                    attributes: ['id'],
                    where: {
                        userId: +req.query.userId,
                        blockId: +req.query.blockId,
                    },
                }))
            )
                throw Error('هذا المستخدم غير محظور في هذا لنوع من الحظر ');

            await blockUser.destroy({
                where: {
                    userId: +req.query.userId,
                    blockId: +req.query.blockId,
                },
            });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت العملية بنجاح',
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    allBlockAboutUser: async (req, res) => {
        try {
            let response = {};
            let userCheck = await user.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.params.id, roleId: 2 },
            });
            if (!userCheck) throw Error('المستخدم المحدد غير موجود');

            let recordBlock = await blockUser.findAndCountAll({
                attributes: { exclude: ['userId', 'blockId'] },
                include: {
                    model: block,
                    required: true,
                    attributes: { exclude: ['id'] },
                },
                raw: true,
                where: { userId: req.params.id },
                paranoid: false,
            });

            let checkIfNowBlocked = recordBlock.rows.some(
                (record) => record.unblock_date == null
            );
            response = { recordBlock, checkIfNowBlocked };
            res.status(StatusCodes.OK).send({
                success: true,
                data: response,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    deleteBlockRecent: async (req, res) => {
        try {
            let response = {};
            let userCheck = await user.findOne({
                attributes: ['id'],
                raw: true,
                where: { id: req.params.id, roleId: 2 },
            });
            if (!userCheck) throw Error('المستخدم المحدد غير موجود');

            let unblockIds = req.body.unblockIds;
            let allBlock = await block.findAll({
                attributes: ['id'],
                raw: true,
            });
            allBlock = allBlock.map((blockInfo) => blockInfo.id);

            unblockIds.forEach((element) => {
                if (!allBlock.includes(element))
                    throw Error('بعض انواع الحظر المدخلة غير صحيحة');
            });

            await Promise.all(
                unblockIds.map(async (element) => {
                    if (
                        !(await blockUser.findOne({
                            paranoid: false,
                            attributes: ['id'],
                            raw: true,
                            where: {
                                userId: req.params.id,
                                blockId: element,
                            },
                        }))
                    )
                        throw Error(
                            'بعض انواع الحظر المدخلة غير مطبقة على هذا المستخدم'
                        );
                })
            );

            await blockUser.destroy({
                force: true,
                where: {
                    userId: req.params.id,
                    blockId: { [Op.in]: unblockIds },
                },
            });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت العملية بنجاح',
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};

/*
     * @auth controllers
     * public
     * @method POST
 
    getMoreDetails: async (req, res) => {
        try {
            if (!req.params.id) throw Error('يجب ان يوجد رقم مستخدم');
            let user = await user.findOne({
                attributes: ['roleId', 'id'],
                where: { id: req.params.id },
                include: { model: category, required: true, required: true },
            });

            if (!user || user.roleId == 1) throw Error('رقم المستخدم خاطئ');
            let details = {};
            let store = null;
            switch (user.roleId) {
                case 2:
                    //normal user
                    let category = await user.getCategories({
                        raw: true,
                        attributes: ['name'],
                    });
                    details = category.map((e) => _.pick(e, 'name'));
                    break;
                case 3:
                case 4:
                    //manger store
                    store = await store.findOne({
                        where: { userId: user.id },
                        raw: true,
                        attributes: { exclude: ['userId', 'categoryId'] },
                        include: {
                            model: category,
                            required: true,
                            attributes: ['name'],
                        },
                    });
                    details.storeInfo = _.omit(store, ['id']);
                    details.storeStory = await storeStory.findAll({
                        raw: true,
                        where: { storeId: store.id },
                        attributes: ['avatar'],
                    });
                    break;
                case 5:
                    //if manger country
                    break;
            }
            res.status(StatusCodes.OK).send({ success: true, data: details });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    */
