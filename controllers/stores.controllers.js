import path from 'path';
import { StatusCodes } from 'http-status-codes';
import { Op, Sequelize } from 'sequelize';
import _ from 'lodash';

// UTILS
import {
    removeFolder,
    sortAvatars,
    removePic,
    moveFile,
} from '../utils/helper.js';

// MODELS
import {
    store,
    packsStore,
    user,
    packs,
    category,
    storeStory,
} from '../models/index.js';

export default {
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //this for create avatars store
    createStoreStory: async (req, store) => {
        //! should upload every image "storeStory"
        try {
            let storeStory = [];
            for (let i = 0; i < req.files.storeStory.length; i++)
                storeStory.push({
                    storeId: store.id,

                    avatar: req.files.storeStory[i].path,
                });
            // console.log(storeStory);
            //create all avatar store
            await storeStory.bulkCreate([...storeStory]);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //create Store
    createStore: async (req, manger) => {
        try {
            let myStore = await store.findOne({
                attributes: ['id'],
                where: {
                    nameStore: req.body.nameStore.trim(),
                },

                paranoid: false,
            });
            if (myStore)
                throw Error(
                    `اسم المحل \'${req.body.nameStore.trim()}\' موجود بلفعل `
                );

            let myCategory = await category.findOne({
                attributes: ['id'],
                where: { name: req.body.category.trim() },
                raw: true,
            });
            if (!myCategory) throw Error('صنف المتجر غير صحيح ');

            //?create new store
            myStore = await store.create({
                ...req.body,
                categoryId: myCategory.id,
                userId: manger.id,
            });

            return { success: true, myStore };
        } catch (err) {
            return { success: false, error: err.message };
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */ //update store
    update: async (req, res) => {
        try {
            if (!req.file) throw Error('لا يوجد صورة ');

            //validate name
            let store = await store.findOne({
                attributes: ['id'],
                where: {
                    nameStore: req.body.nameStore.trim(),
                    userId: { [Op.ne]: req.user.id },
                },
                paranoid: false,
            });
            if (store)
                throw Error(
                    `اسم المتجر \'${req.body.nameStore.trim()}\' موجود بلفعل `
                );

            //?check category id
            let category = await category.findOne({
                attributes: ['id'],
                where: { name: req.body.category.trim() },
            });
            if (!category) throw Error('اسم الصنف  غير صحيح');

            store = await store.findOne({
                attributes: ['avatar'],
                where: { userId: req.user.id },
            });
            // store = req.user.toJSON().store[0];
            //path in temp
            let pathBefore = store.avatar;
            // console.log(pathBefore, "before");
            //remove the avatar from the temp folder
            removePic(pathBefore);

            // console.log(req.file.path, "now");
            //update store in db
            await store.update(
                {
                    ...req.body,
                    avatar: req.file.path,
                    categoryId: category.id,
                    userId: req.user.id,
                },
                { where: { userId: req.user.id } }
            );
            res.status(StatusCodes.OK).send({
                success: true,
                msg: `تم التحديث بنجاح `,
            });
        } catch (err) {
            if (req.file) removePic(req.file.path);
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    getAllInfo: async (req, res) => {
        try {
            let store = await store.findOne({
                where: { userId: req.user.id },
                attributes: [
                    'id',
                    'nameStore',
                    ['avatar', 'picture'],
                    'fromHour',
                    'toHour',
                    'longitude',
                    'latitude',
                ],
                include: [
                    {
                        model: category,
                        required: true,

                        attributes: [['name', 'nameCategory']],
                    },
                    {
                        model: user,
                        required: true,

                        attributes: ['email', 'phoneNumber', 'email'],
                    },
                ],
            });
            let AllStory = await storeStory.findAll({
                where: { storeId: store.id },
                attributes: [['avatar', 'picture']],
            });

            //here should ask front end if need to show this packs or not
            //packs
            let packs = await packsStore.findAll({
                where: { storeId: store.id },
                attributes: ['createdAt'],
                include: {
                    model: packs,
                    required: true,
                    attributes: { exclude: ['id'] },
                },
            });
            // console.log(packs);

            // packs = _.pick(packs[0], ["name", "duration", "price", "createdAt"]);
            let resultStore = _.omit(store.toJSON(), ['id']);
            resultStore.packs = packs;
            resultStore.storyStore = AllStory;

            res.status(StatusCodes.OK).send({
                success: true,
                data: resultStore,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    //! packs
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    disablePack: async (req, res) => {
        try {
            let store = await req.user.getStores({
                raw: true,
                attributes: ['id'],
            });
            if (store.toString() == []) throw Error('يجب ان تمتلك متجر اولا ');

            const packs = await packs.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!packs) throw Error('رقم الباقة غير صحيح ');

            let packDel = await packsStore.findOne({
                where: { packId: req.params.id },
                attributes: ['id'],
            });
            if (!packDel)
                throw Error(
                    'الباقة المطلوبة محذوفة مسبقا او انك لم تشترك فيها '
                );

            await packDel.destroy();
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تم الحذف بنجاح',
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */

    //get all packs of this store and other store with have this user
    getPacks: async (req, res) => {
        try {
            let result = { active: {}, ended: [] };
            let all = await packsStore.findAll({
                attributes: ['createdAt', 'deletedAt', 'id'],
                paranoid: false,
                raw: true,
                include: [
                    {
                        model: packs,
                        required: true,

                        attributes: ['name', 'duration', 'price'],
                        required: true,
                    },
                    {
                        model: store,
                        where: { userId: req.user.id },
                        attributes: [],
                        required: true,
                    },
                ],
            });

            all.forEach((record) => {
                if (record.deletedAt) result.ended.push(record);
                else result.active = record;
            });
            res.status(StatusCodes.OK).send({ success: true, data: result });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */

    //choose one of the packs for store
    choosePack: async (req, res) => {
        try {
            let storeInfo = await store.findOne({
                attributes: ['id'],
                where: { userId: req.user.id },
            });
            if (!storeInfo)
                throw Error('لا يمكنك عرض الباقات دون ان تكون تمتلك متجر ');

            let myPack = await packs.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!myPack) throw Error('رقم الباقة المدخل غير صحيح ');

            if (
                await packsStore.findOne({
                    attributes: ['id'],
                    where: { storeId: storeInfo.id },
                })
            )
                throw Error(
                    'انت مشترك في باقة من قبل لايمكنك ان تشترك في اكثررمن باقة في نفس الوقت الرجاء الانتظار ل انتهار مدة الباقة او الغائها ثم قم  ب اعادة الاشتراك في باقة جديدة '
                );
            // console.log(req.params.id);
            await packsStore.create({
                storeId: storeInfo.id,
                packId: req.params.id,
                discount: 1,
                takenOrNot: false,
            });
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تم الاشتراك في الباقة بنجاح',
            });
        } catch (err) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //! image avatar store
    //upload image
    uploadImage: async (req, res, next) => {
        try {
            if (!req.file) throw Error('لا يوجد صورة ');
            let store = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['id'],
            });
            let str = req.file.path;
            let serverIndex = str.indexOf('\\upload');
            if (serverIndex !== -1) req.file.path = str.substring(serverIndex);

            await store.update(
                { avatar: req.file.path },
                { where: { id: store.id } }
            );
            removePic(store.avatar);

            res.status(StatusCodes.OK).send({ success: true });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    // get image
    getImage: async (req, res) => {
        try {
            let store = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['avatar'],
            });
            if (!store.avatar) throw Error('لا يوجد صورة ');
            res.status(StatusCodes.OK).send({
                success: true,
                data: store.avatar,
            });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //delete image
    deleteImage: async (req, res) => {
        try {
            let store = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['avatar', 'id'],
            });
            // console.log(store);
            if (!store.avatar) throw Error('لا يوجد صورة ');
            await store.update({ avatar: null }, { where: { id: store.id } });
            removePic(store.avatar);

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
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //! story store
    //upload story mean add new story
    uploadStory: async (req, res, next) => {
        try {
            if (!req.file) throw Error('لا يوجد صورة ');

            let myStore = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['id'],
            });

            let allStory = await storeStory.findAll({
                raw: true,
                where: { storeId: myStore.id },
                attributes: ['id'],
            });
            if (allStory.length == 4)
                throw Error('لا يمكن ان يكون لديك اكثر من 4 صور ');
            else {
                let myPath = moveFile(
                    req.file.path,
                    path.join(
                        __dirname,
                        `../upload/images/mangers/${req.user.id}`
                    )
                );
                req.file.path = myPath;

                let str = req.file.path;
                let serverIndex = str.indexOf('\\upload');
                if (serverIndex !== -1)
                    req.file.path = str.substring(serverIndex);

                await storeStory.create({
                    avatar: req.file.path,
                    storeId: myStore.id,
                });
                res.status(StatusCodes.OK).send({
                    success: true,
                    msg: 'تمت عملية الرفع بنجاح',
                });
            }
        } catch (err) {
            if (req.file) removePic(req.file.path);
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },

    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    // get All image
    getAllStory: async (req, res) => {
        try {
            let data = await storeStory.findAll({
                attributes: ['avatar', 'id'],
                include: {
                    model: store,
                    attributes: [],
                    required: true,

                    where: { userId: req.user.id },
                },
            });

            res.status(StatusCodes.OK).send({ success: true, data });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //delete image
    deleteStory: async (req, res) => {
        try {
            let deleteStory = await storeStory.findOne({
                attributes: ['avatar'],
                include: {
                    model: store,
                    required: true,

                    attributes: ['id'],
                    where: {
                        userId: req.user.id,
                        id: Sequelize.col('storeStory.storeId'),
                    },
                },
                where: { id: req.params.id },
            });

            if (!deleteStory) throw Error('رقم الصورة المطلوب غير صحيح');

            await storeStory.destroy({ where: { id: req.params.id } });
            removePic(deleteStory.avatar);

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
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */

    //delete image
    deleteAllStory: async (req, res) => {
        try {
            let allStory = await storeStory.findAll({
                raw: true,
                attributes: ['avatar'],
                include: {
                    model: store,
                    required: true,

                    attributes: ['id'],
                    where: {
                        userId: req.user.id,
                        id: Sequelize.col('storeStory.storeId'),
                    },
                },
            });

            if (allStory.toString() == []) throw Error('لا يوجد صور لحذفها ');

            await storeStory.destroy({
                where: { storeId: allStory[0]['store.id'] },
            });

            allStory.forEach((e) => {
                removePic(e.avatar);
            });
            // console.log();
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
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    //update Image Story mean update recent story
    updateStory: async (req, res, next) => {
        try {
            if (!req.file) throw Error('لا يوجد صور ');
            //get store
            let store = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['id'],
            });
            let image = await storeStory.findOne({
                attributes: ['avatar'],
                where: { storeId: store.id, id: req.params.id },
            });
            if (!image) throw Error('رقم الصورة المطلوب غير صحيح');

            let str = req.file.path;
            let serverIndex = str.indexOf('\\upload');
            if (serverIndex !== -1) req.file.path = str.substring(serverIndex);

            await storeStory.update(
                { avatar: req.file.path },
                { where: { storeId: store.id, id: req.params.id } }
            );
            let err = removePic(image.avatar);
            if (err) throw Error(err.message);
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت عملية التحديث بنجاح',
            });
        } catch (err) {
            if (req.file) removePic(req.file.path);

            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    // get Special Story
    getSpecialStory: async (req, res) => {
        try {
            let story = await storeStory.findOne({
                attributes: ['avatar', 'id'],
                include: {
                    model: store,
                    required: true,

                    attributes: [],
                    where: {
                        userId: req.user.id,
                        id: Sequelize.col('storeStory.storeId'),
                    },
                },
                where: { id: req.params.id },
            });

            if (!story) throw Error('الصورة المطلوبة غير مودجودة');

            res.status(StatusCodes.OK).send({ success: true, data: story });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */ // ! offer
    verifyOffer: async (req, res) => {
        try {
            let info = verifyQROffer(req.body.QR.trim());

            let myOffer = await offersUser.findOne({
                where: {
                    offerId: info.offerId,
                    userId: info.userId,
                },
            });
            if (!myOffer) throw Error('القيم المدخلة غير صحيحة');

            await myOffer.destroy();

            res.status(StatusCodes.OK).send({ success: true });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    usersOfOffer: async (req, res) => {
        try {
            let myStore = await store.findOne({
                where: { userId: req.user.id },
                attributes: ['id'],
                raw: true,
            });
            let data = await offersUser.findAll({
                where: { offerId: req.params.id, dataTake: { [Op.not]: null } },
                paranoid: false,
                attributes: ['createdAt', 'dataTake'],
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        attributes: [],
                        model: offer,
                        required: true,
                        where: { id: req.params.id, storeId: myStore.id },
                    },
                    {
                        model: user,
                        required: true,
                        attributes: ['name', 'username', 'avatar', 'gender'],
                    },
                ],
            });
            res.status(StatusCodes.OK).send({ success: true, data });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};
