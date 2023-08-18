import moment from 'moment';
import { StatusCodes } from 'http-status-codes';
import _ from 'lodash';

//UTILS
import { createQROffer } from '../utils/jwt.js';
import { sequelize } from '../utils/connect.js';

//MODELS
import {
    store,
    user,
    offersUser,
    storeStory,
    category as Category,
    users_Pivot_category,
    token as tokenTable,
    packsStore,
    notification,
    category,
    giftedOffers,
} from '../models/index.js';
import { Op, Sequelize } from 'sequelize';
import {
    enumShowNotification,
    enumTakenAddOfferOrNot,
} from '../utils/enums.js';

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //! interests User
    setInterests: async (req, user) => {
        //user now sign in
        try {
            let allIntBefore = await users_Pivot_category.findAll({
                raw: true,
                where: { userId: user.id },
            });

            let allCategory = await Category.findAll({
                attributes: ['name', 'id'],
                raw: true,
            });
            //we using "set" for unique value
            let category = new Set(req.body.category.map((e) => e.trim()));
            //should every name category is in database
            let ans = [...category].every((e) =>
                allCategory.some((element) => e == element.name)
            );

            if (!ans)
                return {
                    error: 'بعض القيم المدخل غير مطابقة للقيم الموجودة ضمن الاصناف الرجاء اعادة ادخال بشكل الصحيح',
                };

            ans = [...category].map((e) =>
                allCategory.some((element) => e == element.name)
            );

            //user to get id for every category
            let array = [...category].map((e) => {
                let idCategory = 0;
                allCategory.forEach((element) => {
                    if (element.name == e) {
                        idCategory = element.id;

                        return;
                    }
                });
                return { userId: user.id, categoryId: idCategory };
            });

            await users_Pivot_category.destroy({ where: { userId: user.id } });

            await users_Pivot_category.bulkCreate([...array]);

            return { success: true };
        } catch (error) {
            await users_Pivot_category.destroy({
                where: { userId: user.id },
            });

            await users_Pivot_category.bulkCreate([allIntBefore]);
            return { success: false, error: error.message };
        }
    },
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //add spam
    addSpam: async (req, res) => {
        try {
            let myInfo = await offersUser.findOne({
                attributes: ['id', 'reasonSpam'],
                raw: true,
                where: {
                    userId: req.user.id,
                    id: req.params.id,
                },
                paranoid: false,
            });
            ///user is not have like this offer
            if (!myInfo) throw Error('رقم العرض المدخل غير صحيح ');

            if (myInfo.reasonSpam)
                throw Error('لقد قمت باجراء عملية الابلاغ على هذا العرض مسبقا');

            //should after 3 days can't do spam for this offer
            let momentDateToday = moment();
            let momentCreatedAt = moment(myInfo.createdAt);
            if (momentDateToday.diff(momentCreatedAt, 'days') > 3)
                throw Error(
                    'لا يمكنك القيام بعملية الابلاغ علما ان صلاحية عملية البلاغ قد انتهت '
                );

            await offersUser.update(
                { reasonSpam: req.body.reasonSpam.trim() },
                { where: { id: req.params.id } }
            );

            res.status(StatusCodes.OK).send({
                success: false,
                msg: 'تم الابلاغ بنجاح',
            });
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
     */ //add spam
    addEvaluate: async (req, res) => {
        try {
            let myInfo = await offersUser.findOne({
                attributes: ['id', 'evaluate'],
                raw: true,
                where: {
                    userId: req.user.id,
                    id: req.params.id,
                },
                paranoid: false,
            });
            ///user is not have like this offer
            if (!myInfo) throw Error('رقم العرض المدخل غير صحيح ');

            if (myInfo.evaluate)
                throw Error('لقد قمت باجراء عملية الابلاغ على هذا العرض مسبقا');

            //should after 3 days can't do spam for this offer
            let momentDateToday = moment();
            let momentCreatedAt = moment(myInfo.createdAt);
            if (momentDateToday.diff(momentCreatedAt, 'days') > 3)
                throw Error(
                    'لا يمكنك القيام بعملية الابلاغ علما ان صلاحية عملية البلاغ قد انتهت '
                );

            await offersUser.update(
                { evaluate: req.body.evaluate.trim() },
                { where: { id: req.params.id } }
            );

            res.status(StatusCodes.OK).send({
                success: false,
                msg: 'تم الابلاغ بنجاح',
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },

    getEvaluateUser: async (req, res) => {
        try {
            if (
                !(await offersUser.findOne({
                    attributes: ['id'],
                    raw: true,
                    where: { packsStoreId: req.params.id, userId: req.user.id },
                }))
            )
                throw Error(
                    'لا يمكنك الحصول على التقيام الخاصة بهذا العرض , لا تملك هذا العرض'
                );

            const { page, size } = req.query;

            let allEvaluateUserPage = await offersUser.findAll({
                attributes: ['evaluate'],
                raw: true,
                limit: +size,
                offset: (+page - 1) * +size,
                include: {
                    model: user,
                    required: true,
                    attributes: ['name', 'username', 'avatar'],
                },
                where: { packsStoreId: req.params.id },
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: allEvaluateUserPage,
            });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({
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
    chooseOffer: async (req, res) => {
        try {
            let dataToday = moment();
            let offerFound = await offersUser.findOne({
                where: { userId: req.user.id },
                attributes: ['id', 'createdAt'],
                raw: true,
                paranoid: false,
            });

            if (offerFound && dataToday.diff(offerFound.createdAt, 'days') < 1)
                throw Error('لا يمكنك اختيار اكثر من عرض بنفس اليوم ');
            /*----------------------------------------- */
            ///? choose random category
            let allCategory = await req.user.getCategories({
                raw: true,
                attributes: ['id', 'name'],
            });
            let randomCategoryId =
                Math.floor(Math.random() * allCategory.length - 1) + 1;
            let myCategory = shuffleArray(allCategory)[randomCategoryId];
            // console.log(myCategory);
            /*----------------------------------------- */
            // for get the store id nearest user with random category
            let resultQuery = await sequelize.query(
                ` SELECT calculate_nearest_store_distance(${req.body.latitude},${req.body.longitude},${myCategory.name}) AS storeId`,
                {
                    type: sequelize.QueryTypes.RAW,
                    raw: true,
                }
            );
            let storeId = resultQuery[0][0].storeId;
            let storeInfo = await store.findOne({
                where: { id: storeId },
                attributes: {
                    exclude: [
                        'unavailableAt',
                        'categoryId',
                        'userId',
                        'requestDelete',
                    ],
                },
            });
            let storeOfStory = await storeStory.findAll({
                where: { storeId },
                attributes: ['avatar'],
            });
            // /*----------------------------------------- */
            // //? choose random offer in store
            let offers = await offer.findAll({
                where: { storeId: storeId },
                raw: true,
                attributes: ['id', 'title', 'description', 'discount'],
            });
            let randomOfferId =
                Math.floor(Math.random() * offers.length - 1) + 1;
            let myOffer = shuffleArray(offers)[randomOfferId];
            // /*----------------------------------------- */
            // //?create token For QR Code
            let QR = createQROffer({
                offerId: myOffer.id,
                userId: req.user.id,
            });
            let offerCreated = await offersUser.create({
                offerId: myOffer.id,
                userId: req.user.id,
                QR,
            });
            res.status(StatusCodes.OK).send({
                success: true,
                data: {
                    offer: myOffer,
                    store: { storeInfo, storeOfStory },
                    duration: moment(offerCreated.createdAt)
                        .add(2, 'days')
                        .format('YYYY-MM-DD hh:mm'),
                    category: myCategory.name,
                    QR,
                },
            });
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
    gift: async (req, res) => {
        try {
            let offer = await offersUser.findOne({
                raw: true,
                attributes: ['dataTake'],
                where: { userId: req.user.id, id: req.params.id },
            });

            if (!offer) throw Error('لا تمتلك هذا العرض ل اهدائه');
            if (offer.dateTake)
                throw Error(
                    'لا يمكن اجراء عملية الاهداء بعد ان تمت اخذ العرض بنجاح'
                );

            let giftedUser = await user.findOne({
                attributes: ['id'],
                raw: true,
                where: { username: req.body.username.trim(), roleId: 2 },
            });
            if (!giftedUser) throw Error('اسم المستخدم غير صحيح');
            //   ! create new QR code
            let QR = createQROffer({
                id: offer.id,
                userId: giftedUser.id,
            });
            await offersUser.update(
                {
                    evaluate: null,
                    reasonSpam: null,
                    userId: giftedUser.id,
                    QR,
                },
                {
                    where: {
                        id: offer.id,
                    },
                }
            );
            await giftedOffers.create({
                sendId: req.user.id,
                recipientId: giftedUser.id,
                offersUserId: offer.id,
            });

            res.status(StatusCodes.OK).send({
                success: false,
                msg: 'تمت عملية الاهداء بنجاح',
            });
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
    alfsdfsdflMysdfsdOffer: async (req, res) => {
        try {
            let result = { now: [], recent: [] };
            let data = await offersUser.findAll({
                attributes: ['createdAt', 'dataTake', 'QR', 'id'],
                paranoid: false,
                where: {
                    userId: req.user.id,
                },
                include: {
                    model: offer,
                    required: true,

                    attributes: ['discount', 'description', 'title', 'id'],
                },
            });
            data.forEach((myOffer) => {
                let momentDateToday = moment();
                let momentCreatedAt = moment(data.createdAt);

                (momentDateToday.diff(momentCreatedAt, 'days') > 2 &&
                    !myOffer.dataTake) ||
                myOffer.dataTake
                    ? result.recent.push(myOffer)
                    : result.now.push(myOffer);
            });
            res.status(StatusCodes.OK).send({ success: true, data: result });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
    allMyOffer: async (req, res) => {
        try {
            const { page, size } = req.query;

            let allCart = await offersUser.findAll({
                limit: +size,
                offset: (+page - 1) * +size,
                attributes: { exclude: ['userId', 'packsStoreId'] },
                include: {
                    model: packsStore,
                    required: true,
                    attributes: [],
                    include: {
                        model: store,
                        required: true,
                        attributes: {
                            exclude: ['requestDelete', 'categoryId', 'userId'],
                        },
                        include: {
                            model: category,
                            required: true,
                            attributes: ['name', 'nameEmo'],
                        },
                    },
                },
                where: { userId: req.user.id },
            });
            allCart = await Promise.all(
                allCart.map(async (cart) => {
                    let allStoryForStore = await storeStory.findAll({
                        raw: true,
                        attributes: ['avatar'],
                        where: { storeId: cart.packsStore.store.id },
                    });
                    return {
                        typeOffer:
                            cart.discount <= process.env.DISCOUNT_FREE
                                ? 'مجاني'
                                : 'مدفوع',
                        storeInfo: {
                            discount: cart.packsStore.discount,
                            ...cart.packsStore.store,
                            category: { ...cart.packsStore.store.category },
                            story: allStoryForStore,
                        },
                        QR: cart.QR,
                        dateTake: cart.dateTake
                            ? 'تم شراء العرض بنجاح'
                            : 'لم يتم شراء العرض بعد',

                        spam: cart.reasonSpam ? true : false,
                        evaluate: cart.evaluate ? true : false,
                        createdAt: cart.createdAt,
                    };
                })
            );
            res.status(StatusCodes.OK).send({
                success: true,
                data: allCart,
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
    allOfferGifted: async (req, res) => {
        try {
            const { page, size } = req.query;

            let allCartGifted = await giftedOffers.findAll({
                attributes: ['createdAt', 'recipientId'],
                limit: +size,
                offset: (+page - 1) * +size,
                where: { sendId: req.user.id },
                include: {
                    model: offersUser,
                    required: true,
                    attributes: ['discount'],
                    include: {
                        model: packsStore,
                        required: true,
                        attributes: [],
                        include: {
                            model: store,
                            required: true,
                            attributes: [
                                'requestDelete',
                                'categoryId',
                                'userId',
                            ],
                            include: {
                                model: category,
                                required: true,
                                attributes: ['name', 'nameEmo'],
                            },
                        },
                    },
                },
            });

            allCartGifted = await Promise.all(
                allCartGifted.map(async (cartOfferGifted) => {
                    let allStoryForStore = await storeStory.findAll({
                        raw: true,
                        attributes: ['avatar'],
                        where: { storeId: cartOfferGifted.packsStore.store.id },
                    });
                    let recipientName = await user.findOne({
                        attributes: ['username'],
                        raw: true,
                        where: {
                            id: cartOfferGifted.recipientId,
                        },
                    });
                    return {
                        typeOffer:
                            cartOfferGifted.offersUser.discount >=
                            process.env.DISCOUNT_FREE
                                ? 'مجاني'
                                : 'مدفوع',
                        storeInfo: {
                            discount: cartOfferGifted.offersUser.discount,
                            ...cartOfferGifted.packsStore.store,
                            category: {
                                ...cartOfferGifted.packsStore.store.category,
                            },
                            story: allStoryForStore,
                        },
                        recipientName,
                        createdAt: cartOfferGifted.createdAt,
                    };
                })
            );
            res.status(StatusCodes.OK).send({
                success: true,
                data: allCartGifted,
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },

    homePage: async (req, res) => {
        let countCart = async (checkIfTaken, discountType) => {
            let conditionTakenOrNot =
                checkIfTaken === 'Taken'
                    ? { dataTake: { [Op.not]: null } }
                    : { dataTake: null };

            let conditionDiscount =
                discountType === 'Free'
                    ? { [Op.lte]: process.env.DISCOUNT_FREE }
                    : { [Op.gte]: process.env.DISCOUNT_PRO };

            let freeCartTaken = await offersUser.findAll({
                raw: true,
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                include: {
                    model: packsStore,
                    required: true,
                    attributes: [],
                    where: {
                        discount: { ...conditionDiscount },
                    },
                },
                group: 'userId', //index
                where: { ...conditionTakenOrNot, userId: req.user.id },
            });
            return freeCartTaken.count;
        };

        try {
            let response = {};
            //!count Gift
            let countGift = await giftedOffers.findAll({
                raw: true,
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                group: 'sendId',
                where: { sendId: req.user.id },
            });

            //! count
            let countFreeTaken = await countCart('Taken', 'Free');
            let countFreeNotTaken = await countCart('notTaken', 'Free');
            let countProTaken = await countCart('Taken', 'Pro');
            let countProNotTaken = await countCart('notTaken', 'Pro');

            // !countNotification
            let countNotificationNotRead = await notification.findAll({
                raw: true,
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                group: 'userId', //index
                where: {
                    showType: enumShowNotification.notShow,
                    userId: req.user.id,
                },
            });

            // !offerNotTakeYet
            let storeInformation = await offersUser.findAll({
                attributes: ['createdAt'],
                include: {
                    model: packsStore,
                    required: true,
                    attributes: ['discount'],
                    include: {
                        model: store,
                        attributes: ['nameStore', 'avatar'],
                        required: true,
                    },
                },
                where: { userId: req.user.id },
            });
            storeInformation = storeInformation.map((infoStore) => {
                return {
                    createdAt: infoStore.createdAt,
                    discount: infoStore.packsStore.discount,
                    store: {
                        name: infoStore.packsStore.store.nameStore,
                        avatar: infoStore.packsStore.store.avatar,
                    },
                };
            });

            // !recentVisited
            let recentVisited = await offersUser.findAll({
                attributes: ['dateTake'],
                include: {
                    model: packsStore,
                    required: true,
                    attributes: ['storeId'],
                },
                where: { userId: req.user.id, dataTake: { [Op.not]: null } },
                limit: 4,
            });
            recentVisited = await Promise.all(
                recentVisited.map(async (myStore) => {
                    let storyForStore = await storeStory.findAll({
                        attributes: ['avatar'],
                        include: {
                            model: store,
                            required: true,
                            attributes: ['nameStore'],
                        },
                        where: { storeId: store.packsStore.storeId },
                    });
                    return {
                        dateTake: myStore.dateTake,
                        namStore: storyForStore.store.nameStore,
                        story: storyForStore,
                    };
                })
            );

            //! countToGetGift
            let countToGetGift = await offersUser.findAll({
                attributes: [
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
                ],
                group: 'userId', //index
                where: {
                    takenAddOfferOrNot: enumTakenAddOfferOrNot.notTaken,
                    userId: req.user.id,
                },
            });
            let countYourGift = Math.floor(countToGetGift[0].count / 5);
            let countToGet = 5 - (countToGetGift[0].count % 5);

            //! response
            response = {
                // العدد الهدايا التي قام ب اهدائها
                countGift: countGift.count,
                // عدد البطاقات التي سيتيم فتحها لنيل هدية اخرى
                countToGetGift: countToGet,
                // عدد الهدايا التي يمتلكها حاليا والتي لم يفتحها الى الان
                // هي مشان مثلا فتح 10 صناديق ف بهل الحالة هوي عندو هديتين وليست وحدة ف بضلو بيطلعلو انو في هدية لم يتم فتحها الى الان لحى يفحها

                countYourGift: countYourGift > 0 ? true : false,
                free: {
                    taken: countFreeTaken,
                    notTaken: countFreeNotTaken,
                },
                pro: {
                    taken: countProTaken,
                    notTaken: countProNotTaken,
                },
                countNotification: countNotificationNotRead.count,

                offerNotTakeYet: storeInformation,
                recentVisited,
            };
            res.status(StatusCodes.OK).send({ success: true, data: response });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },

    filterOffer: async (req, res) => {
        try {
            const { page, size, search, type } = req.query;
            let ids = req.query.category;
            ids = ids.map((e) => +e);

            // console.log(page, size, search, type, ids);
            // check valid ids
            let allValidIds = await category.findAll({
                attributes: ['id'],
                raw: true,
            });
            allValidIds = allValidIds.map((element) => element.id);

            ids.forEach((element) => {
                if (!allValidIds.includes(element))
                    throw Error('بعض القيم التصنيفات المدخلة غير صحيحة');
            });
            let conditionDiscoun =
                type === 'free'
                    ? { discount: { [Op.lte]: process.env.DISCOUNT_FREE } }
                    : { discount: { [Op.gte]: process.env.DISCOUNT_PRO } };

            let allCart = await offersUser.findAll({
                limit: +size,
                offset: (+page - 1) * +size,
                attributes: { exclude: ['userId', 'packsStoreId'] },
                include: {
                    model: packsStore,
                    required: true,
                    attributes: ['discount'],
                    where: { ...conditionDiscoun },
                    include: {
                        model: store,
                        required: true,
                        attributes: {
                            exclude: ['requestDelete', 'categoryId', 'userId'],
                        },
                        where: { nameStore: { [Op.like]: `%${search}%` } },
                        include: {
                            model: category,
                            required: true,
                            attributes: ['name', 'nameEmo'],
                            where: { id: { [Op.in]: ids } },
                        },
                    },
                },
                where: { userId: req.user.id },
            });
            allCart = await Promise.all(
                allCart.map(async (cart) => {
                    let allStoryForStore = await storeStory.findAll({
                        raw: true,
                        attributes: ['avatar'],
                        where: { storeId: cart.packsStore.store.id },
                    });
                    return {
                        typeOffer: type,
                        storeInfo: {
                            discount: cart.packsStore.discount,
                            ...cart.packsStore.store,
                            category: { ...cart.packsStore.store.category },
                            story: allStoryForStore,
                        },
                        QR: cart.QR,
                        dateTake: cart.dateTake
                            ? 'تم شراء العرض بنجاح'
                            : 'لم يتم شراء العرض بعد',

                        spam: cart.reasonSpam ? true : false,
                        evaluate: cart.evaluate ? true : false,
                        createdAt: cart.createdAt,
                    };
                })
            );
            res.status(StatusCodes.OK).send({
                success: true,
                data: allCart,
            });
        } catch (error) {
            // console.log(error);
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
    filterGifted: async (req, res) => {
        try {
            const { page, size, search, type } = req.query;
            let ids = req.query.category;
            ids = ids.map((e) => +e);

            // console.log(page, size, type, ids);
            // check valid ids
            let allValidIds = await category.findAll({
                attributes: ['id'],
                raw: true,
            });
            allValidIds = allValidIds.map((element) => element.id);

            ids.forEach((element) => {
                if (!allValidIds.includes(element))
                    throw Error('بعض القيم التصنيفات المدخلة غير صحيحة');
            });
            let conditionDiscoun =
                type === 'free'
                    ? { discount: { [Op.lte]: process.env.DISCOUNT_FREE } }
                    : { discount: { [Op.gte]: process.env.DISCOUNT_PRO } };

            let allCartGifted = await giftedOffers.findAll({
                attributes: ['createdAt', 'recipientId'],
                limit: +size,
                offset: (+page - 1) * +size,
                where: { sendId: req.user.id },
                include: {
                    model: offersUser,
                    required: true,
                    attributes: ['discount'],
                    where: { ...conditionDiscoun },
                    include: {
                        model: packsStore,
                        required: true,
                        attributes: [],
                        include: {
                            model: store,
                            required: true,
                            attributes: [
                                'requestDelete',
                                'categoryId',
                                'userId',
                            ],
                            where: { nameStore: { [Op.like]: `%${search}%` } },
                            include: {
                                model: category,
                                required: true,
                                attributes: ['name', 'nameEmo'],
                                where: { id: { [Op.in]: ids } },
                            },
                        },
                    },
                },
            });

            allCartGifted = await Promise.all(
                allCartGifted.map(async (cartOfferGifted) => {
                    let allStoryForStore = await storeStory.findAll({
                        raw: true,
                        attributes: ['avatar'],
                        where: { storeId: cartOfferGifted.packsStore.store.id },
                    });
                    let recipientName = await user.findOne({
                        attributes: ['username'],
                        raw: true,
                        where: {
                            id: cartOfferGifted.recipientId,
                        },
                    });

                    return {
                        typeOffer: type,
                        storeInfo: {
                            discount: cartOfferGifted.offersUser.discount,
                            ...cartOfferGifted.packsStore.store,
                            category: {
                                ...cartOfferGifted.packsStore.store.category,
                            },
                            story: allStoryForStore,
                        },
                        recipientName,
                        createdAt: cartOfferGifted.createdAt,
                    };
                })
            );
            res.status(StatusCodes.OK).send({
                success: true,
                data: allCartGifted,
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
};
