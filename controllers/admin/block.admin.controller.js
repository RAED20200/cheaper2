import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
//MODELS
import { store, user, block, blockUser } from '../../models/index.js';

export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //create block
    create: async (req, res) => {
        try {
            let ban = await block.findOne({
                attributes: ['id'],
                where: {
                    reason: req.body.reason.trim(),
                },
            });
            if (ban)
                throw Error(
                    'نفس السبب موجود سابقا الرجاء القيام بتغيرالسبب ثم اجراء عملية الاضافة '
                );
            ///لازم امنعو من انو يدخل نوع حظر ل تسجيل الدخول التعديل على حسابه
            let dataJson = JSON.stringify(_.pick(req.body, 'restrictions'));
            // console.log(dataJson);
            await block.create({
                reason: req.body.reason,
                restrictions: dataJson,
                duration: req.body.duration,
            });
            res.status(StatusCodes.CREATED).send({
                success: true,
                msg: `تم إنشاء بنجاح`,
            });
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
    //update  block
    update: async (req, res) => {
        try {
            let ban = await block.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!ban) throw Error('رقم غير صحيح ');

            ban = await block.findOne({
                attributes: ['id'],

                where: {
                    reason: req.body.reason.trim(),
                    id: { [Op.not]: req.params.id },
                },
            });
            if (ban)
                throw Error(
                    'السبب موجود سابقا الرجاء القيام بعملية تغير ثم اجراء عملية الاضافة'
                );

            let dataJson = JSON.stringify(_.pick(req.body, 'restrictions'));

            await block.update(
                {
                    name: req.body.reason.trim(),
                    restrictions: dataJson,
                    duration: req.body.duration,
                },
                { where: { id: req.params.id } }
            );
            return res
                .status(StatusCodes.OK)
                .send({ success: true, msg: `تمت عملية التحديث بنجاح` });
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
    //remove  block
    remove: async (req, res) => {
        try {
            const ban = await block.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!ban) throw Error('رقم غير صحيح ');

            // if (req.params.id <= 5)
            //   throw Error("لا يمكنك حذف احدى الصلاحيات الاساسية الموجودة في النظام ");

            await ban.destroy({ force: true });
            return res
                .status(StatusCodes.OK)
                .send({ success: true, msg: 'تمت عملية الحذف بنجاح' });
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
    //get all block
    getAll: async (req, res) => {
        try {
            let data = await block.findAll({ raw: true });
            data = data.map((blockInfo) => {
                return {
                    id: blockInfo.id,
                    reason: blockInfo.reason,

                    ...JSON.parse(JSON.parse(blockInfo.restrictions)),
                    duration: blockInfo.duration,
                };
            });
            return res.status(StatusCodes.OK).send({ success: true, data });
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
     */ //block manger store
    blockManger: async (req, res) => {
        try {
            if (!(await user.findByPk(req.body.userId, { attributes: ['id'] })))
                throw Error('رقم المستخدم غير صحيح');

            if (
                !(await block.findByPk(req.body.banListId, {
                    attributes: ['id'],
                }))
            )
                throw Error('رقم نوع الحظر غير صحيح');

            let blocked = await blockUser.findOne({
                attributes: ['id'],
                where: {
                    userId: req.body.userId,
                    banListId: req.body.banListId,
                },
            });
            if (blocked) throw Error(`هذا المستخدم محظور مسبقا `);

            await blockUser.create({
                userId: req.body.userId,
                banListId: req.body.banListId,
            });
            return res
                .status(StatusCodes.OK)
                .send({ success: true, msg: 'تمت عملية الحظر بنجاح ' });
        } catch (err) {
            // console.log(err);
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
    //un block manger store
    unBlockManger: async (req, res) => {
        try {
            if (!(await user.findByPk(req.body.userId, { attributes: ['id'] })))
                throw Error('رقم المستخدم غير صحيح');

            if (
                !(await block.findByPk(req.body.banListId, {
                    attributes: ['id'],
                }))
            )
                throw Error('رقم نوع الحظر غير صحيح');

            let blocked = await blockUser.findOne({
                attributes: ['id'],
                where: {
                    userId: req.body.userId,
                    banListId: req.body.banListId,
                },
            });
            if (!blocked)
                throw Error(`هذا المستخدم غير محظور من نوع الحظر هذا `);

            await blocked.destroy();
            return res
                .status(StatusCodes.OK)
                .send({ success: true, msg: 'تمت ازالة الحظر بنجاح ' });
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
    //un block every blocks for this manger store
    unBlockAllForManger: async (req, res) => {
        try {
            if (!(await user.findByPk(req.params.id, { attributes: ['id'] })))
                throw Error('رقم مدير المتجر غير صحيح');

            let allBlocked = await blockUser.findAll({
                attributes: ['id'],
                where: { userId: req.params.id },
            });
            // console.log(allBlocked);
            if (allBlocked.toString() == [])
                throw Error('لا يوجد اي نوع من الحظر على مدير المحل هذا ');
            allBlocked.forEach(async (e) => await e.destroy());
            return res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت ازالة جميع انواع الحظر بنجاح ',
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
    //records Blocked for manger store
    allBlockRecordManger: async (req, res) => {
        try {
            let user = await user.findByPk(req.params.id, {
                attributes: ['email', 'phoneNumber1', 'username'],
                raw: true,
            });
            if (!user) throw Error('رقم مدير المتجر غير صحيح');
            let result = { active: [], notActive: [] };
            let allBlocked = await blockUser.findAll({
                where: { userId: req.params.id },
                attributes: { exclude: ['id', 'userId', 'banListId'] },
                include: {
                    model: block,
                    required: true,
                    attributes: ['reason', 'duration'],
                },
                paranoid: false,
                raw: true,
            });
            // console.log(allBlocked);
            allBlocked.forEach((e) => {
                e.user = user;
                if (e.unblock_date) result.notActive.push(e);
                else result.active.push(e);
            });
            return res
                .status(StatusCodes.OK)
                .send({ success: true, data: result });
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
    //remove records Blocked for manger store
    removeAllBlockRecord: async (req, res) => {
        try {
            if (!(await user.findByPk(req.params.id, { attributes: ['id'] })))
                throw Error('رقم مدير المتجر غير صحيح');

            let allBlocked = await blockUser.findAll({
                attributes: ['unblock_date'],

                where: { userId: req.params.id },
                paranoid: false,
            });
            if (allBlocked.toString() == [])
                throw Error('لا يوجد اي نوع من الحظر على مدير المحل هذا ');
            let check = allBlocked.every((e) =>
                e.unblock_date ? false : true
            );

            if (check)
                throw Error('لا يوجد اي سجلات محظورة  منتهية مدير المحل ');
            allBlocked.forEach(async (e) => {
                if (e.unblock_date) await e.destroy({ force: true });
            });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت ازالة جميع سجلات الحظر بنجاح ',
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
    //all Block Record every mangers store
    allBlockRecordEvery: async (req, res) => {
        try {
            let allStore = await blockUser.findAll({
                raw: true,
                attributes: { exclude: ['id', 'userId', 'banListId'] },
                include: [
                    {
                        model: user,
                        required: true,

                        include: {
                            model: store,
                            required: true,
                            attributes: [
                                'nameStore',
                                'avatar',
                                'longitude',
                                'latitude',
                            ],
                        },
                        attributes: ['email', 'phoneNumber1', 'username'],
                    },
                    { model: block, attributes: ['reason', 'duration'] },
                ],
            });

            allStore = allStore.map((e) => _.omit(e, ['user.stores.id']));

            return res
                .status(StatusCodes.OK)
                .send({ success: true, data: allStore });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};
