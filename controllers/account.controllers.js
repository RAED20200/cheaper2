import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import fs from 'fs';
import { Op } from 'sequelize';
import rand from 'randomstring';
import _ from 'lodash';
import NodeCache from 'node-cache';
import path from 'path';
// import sharp

//UTILS
import { compare } from '../utils/bcrypt.js';
import { removePic, moveFile, emailBody } from '../utils/helper.js';
import { sendCheck } from '../utils/nodemailer.js';
//MODELS
import {
    store,
    user as users,
    offersUser,
    packsStore,
    notification,
    blockUser,
    block,
    token,
} from '../models/index.js';
//CONTROLLER
import controlUser from '../controllers/users.controllers.js';
import { enumShowNotification } from '../utils/enums.js';

const myCache = new NodeCache();
// help function
//remove account manager
let removeManger = async (req, myIfoStore, b) => {
    try {
        let userOffers = await offersUser.findAll({
            raw: true,
            attributes: ['createdAt'],
            where: {
                dataTake: { [Op.not]: null },
            },
            include: {
                model: packsStore,
                required: true,
                attributes: [],
                include: {
                    model: store,
                    required: true,
                    attributes: [],
                    where: { id: myIfoStore.id },
                },
            },
        });

        const now = moment();

        let countOfCartNotTaken = userOffers.filter(
            (offerCart) => now.diff(offerCart.createdAt, 'day', true) < 2
        ).length;

        //if not found date and found   any record  offer for user then execute this
        if (!myIfoStore.requestDelete && countOfCartNotTaken) {
            // manger myIfoStore first once to disable or delete  the myIfoStore , then not allow him to disable or delete before ended the all user offers taken
            myIfoStore.requestDelete = new Date();
            await myIfoStore.save();
            throw Error(
                'لا يمكنك ان تقوم بهذه العملية حتى يتم انتهاء جميع المستخدمين من استلام العروض او انتهاء مدة العرض علما انه من هذه اللحظة  ستيم ايقاف ظهور نسبة المحل ضمن الصناديق يمكنك اعادة الظهور من خلال زر الاعادة التفعيل'
            );
            //if found record offer for user not taken yet then execute this
        } else if (countOfCartNotTaken)
            throw Error(
                'لا يمكنك القيام بهذه العملية حتى يتم انتهاء فترة العروض او تسليم العروض لزبائن'
            );
        //if found date and not found any offer for user then execute this
        else {
            //here the manger is click disable after is not has any record  (getOffers_pivot_users)
            //! here should hooks before delete then delete every thing about this store
            await req.user.destroy({ force: true });
            //! should write in the hooks if before delete is soft delete then not delete but set disable,otherwise remove it
        }
        return true;
    } catch (err) {
        return { err: err.message };
    }
};
// async function convertToJpeg(inputFilename, req) {
//     console.log(path.parse(inputFilename));
//     const outputFilename = `${path.parse(inputFilename).name}.jpg`;

//     let metadata = await sharp(inputFilename).metadata();
//     if (metadata.format === 'png') {
//         sharp(inputFilename)
//             .toFormat('jpeg')
//             .toFile(outputFilename, (err, info) => {
//                 if (err) console.log(err);
//                 else {
//                     moveFile(
//                         path.resolve() + '\\' + outputFilename,
//                         path.resolve() + '\\' + 'upload'
//                     );
//                     removePic(req.file.path);
//                 }
//             });
//     }
//     return outputFilename;
// }
/*
ضل بس ضغط الصور وتحويلهن ل jpeg
اختبار عملية حذف الحساب في حال كان عندي مدير محل وعندو مستخدمين ما اخدو لعرض
اختبار الايميل 
اختبار التحقق من الايميل عن طريق الرابط 
اتغير رقم الهاتف



راوتر يقوم بعملية اعادة تفعيل المحل 
راوتر يقوم بملية طلب الحذف


*/
export default {
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    
    getProfile: async (req, res) => {
        try {  let user = {};
         
                user.userInformation = _.omit(req.user.toJSON(), [
                    'disableAt',
                    'id',
                    'roleId',
                    'createdAt',
                    'moreInfo',
                    'password',
                    'role',
                ]); 
                user.devices=await token.findAll({
                    
                    attributes:["browser","system","device","logInDate"],
                    raw:true,
                    where:{
                    userId:req.user.id}})
                    if(req.user.role.id===2)
                    // user
                      {  let allCategory = await req.user.getCategories({
                            raw: true,
                            attributes: ['name', 'nameEmo'],
                        });
                         user.category = allCategory.map((categoryElement) => {
                            return {
                                name: categoryElement.name,
                                nameEmo: categoryElement.nameEmo,
                            };
                        });
                      }
                       
            res.status(StatusCodes.OK).json({ success: true, data: user });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */  
    update: async (req, res) => {
        try {
            if (req.role.id != 2 && req.body.category)
                throw Error('لا يمكنك ارسال الاهتمام لهذا النوع من الحساب');
 
   
           
        if (req.role.id === 2 && req.body.category.length < 3)
                throw Error('يجب ان يتم اختيار 3 اهتمامات على الاقل');

              //check value
            let user = await users.findOne({
                attributes: ['id', 'avatar'],
                where: {
                    id: { [Op.ne]: req.user.id },
                    username: req.body.username.trim(),
                },
                paranoid: false,
            });
            if (user) throw Error('اسم المستخدم  موجود مسبقاً');

            let userInfo = null;
            if (req.role.id == 2) {
                //user account
                if (!req.body.category)
                    throw Error('لا يمكنك ترك الاهتمامات فارغة');
                //update interests
                let { error } = await controlUser.setInterests(req, req.user);
                if (error) throw Error(error);

                userInfo = { ...req.body };
            }
            // for image
            let avatarLink = null;
            if (req.file && req.user.avatar) {
                // should update with new image
                avatarLink = process.env.LINK + `/images/${req.file.filename}`;

                // delete image recent
                let str = req.user.avatar;
                let serverIndex = str.indexOf('/images/');
                removePic(
                    path.join(path.resolve(), str.substring(serverIndex))
                );
            } else if (req.file && !req.user.avatar) {
                avatarLink = process.env.LINK + `/images/${req.file.filename}`;

                //should  store image
            } else if (!req.file && req.user.avatar) {
                // delete image recent
                let str = req.user.avatar;
                let serverIndex = str.indexOf('/images/');
                removePic(
                    path.join(path.resolve(), str.substring(serverIndex))
                );
                avatarLink = null;
            } else if (!req.file & !req.user.avatar) {
                // don't do any things
                avatarLink = null;
            }

            await users.update(
                { ...userInfo, avatar: avatarLink },
                { where: { id: req.user.id } }
            );
            res.status(StatusCodes.OK).send({ success: true });
        } catch (error) {
            if (req.file) removePic(req.file.path);
            return res
                .status(StatusCodes.BAD_REQUEST)
                .send({ success: false, error: error.message });
        }
    }, 
   
      
    /*
     * @account
     * @public
     * @method POST
     * @work change password
     */
    //change password
    changePassword: async (req, res) => {
        try {
            if (req.body.password == req.body.newPassword)
                throw Error('الرجاء ادخال كلمة مرور مختلفة عن الكلمة السابقة ');

            //compare password
            const validPassword = await compare(
                req.body.password,
                req.user.password
            );
            // console.log(req.body.password, req.user.password);
            // let agent = useragent.parse(req.headers["user-agent"]);
            /// console.log(validPassword);
            if (!validPassword) {
                // let emailBody = `
                // <h3>بعض الاجهوزة تحاول تغير كلمة المرور الخاص بك هل هو انت ام شخص اخر ؟ الرجاء القيام بتغير كلمة المرور لحماية الحساب الخاص بك </h3>
                // <h3>تفاصيل الجهاز </h3>
                // <h2>browser : ${agent.family}</h2><br>
                // <h2>system : ${agent.os.toString()}</h2><br>
                // <h2>device : ${agent.device.toString()}</h2><br>
                // <h2>ip : ${req.ip.toString()}</h2><br>
                // `;
                // await sendCheck(req.user.email, emailBody);
                throw Error('كلمة المرور غير صحيحة ');
            }

            req.user.password = req.body.newPassword;
            await req.user.save();
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

    //change phone number
    changePhone: async (req, res) => {
        try {
            if (req.user.phoneNumber.trim() == req.body.phoneNumber.trim())
                throw Error('الرجاء ادخال رقم هاتف مختلف');

            let user = await user.findOne({
                attributes: ['id'],
                where: {
                    phoneNumber: req.body.phoneNumber.trim(),
                    id: { [Op.not]: req.user.id },
                },
            });

            if (user) throw Error('رقم الهاتف موجود لحساب اخر');

            req.user.phoneNumber = req.body.phoneNumber;
            await req.user.save();
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

 
    editEmail: async (req, res) => {
        try {
            const validPassword = await compare(
                req.body.password,
                req.user.password
            );
            if(req.user.email===req.body.newEmail)
            throw Error("الايميل نفسه الايمل السابق الرجاء القيام ب اضافة ايميل مختلف")
            if (!validPassword) {
                let emailBody = `<h3>بعض الاجهوزة تحاول تغير الايميل الخاص بك هل هو انت ام شخص اخر ؟ الرجاء القيام بتغير كلمة المرور لحماية الحساب الخاص بك </h3>`;

                await sendCheck(req.user.email, emailBody);
                throw Error('كلمة المرور غير صحيحة ');
            }
            const code = rand.generate({
                length: 6,
                charset: 'numeric',
            });
            let link = `${process.env.LINK}/account/verify?code=${code}`;

            let body = emailBody(code,link)
                        let result = await sendCheck(req.body.newEmail, body);
            if (result.error) throw Error(result.error);
            //set the value in cache with user ID
            myCache.set(
                req.user.id,
                JSON.stringify({
                    newEmail: req.body.newEmail,
                    code,
                })
            );
            //use to remove the code from the cache after 10 minute
            setTimeout(() => {
                let result = myCache.get(req.user.id);

                if (result) myCache.del(req.user.id);
            }, 10 * 60 * 1000);

            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تم ارسال الرمز الى الايميل المدخل ',
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    verify: async (req, res) => {
        try {
            let cahshMemory = myCache.get(req.user.id);
            if (!cahshMemory)
                throw Error(
                    'الرقم المدخل غير صحيح او انه انتهت المدة المسموحة الراجاء اعادة الضغط على اعادة ارسال الكود من جديد '
                );
            cahshMemory = JSON.parse(cahshMemory);

            if (cahshMemory.code !== req.query.code)
                throw Error('الرقم المدخل غير صحيح');

            await users.update(
                { email: cahshMemory.newEmail },
                { where: { id: req.user.id } }
            );

            myCache.del(req.user.id);

            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تمت تاكيد الايميل بنجاح',
            });
        } catch (error) {
            res.status(StatusCodes.BAD_GATEWAY).send({
                success: false,
                error: error.message,
            });
        }
    },
        /*
        * @employee
        * @private
        * @method POST
        * @work add new employee
        */
    getNotification: async (req, res) => {
        try {
            let { page, size } = req.query;
            await notification.update(
                {showType: enumShowNotification.SHOW },
                {
                    offset: (+page - 1) * +size,
                    limit: +size,
                    where: { userId: req.user.id },
                }
            );
            let data = await notification.findAll({   
                attributes: { exclude: ['showType', 'userId'] },   raw: true,
                limit: +size,
                offset: (+page - 1) * +size,
                where: { userId: req.user.id },
            });


            res.status(StatusCodes.OK).json({
                success: true,
                data,
            });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: error.message,
            });
        }
    },
    /*
    * @employee
    * @private
    * @method POST
    * @work add new employee
    */
    myPermissionAndRestrictions: async (req, res) => {
        try {
            let allPermision = {
                name: req.role.name,
                show: JSON.parse(JSON.parse(req.role.data)).show,
                action: JSON.parse(JSON.parse(req.role.data)).action,
            };
            let allRestrictions = await blockUser.findAll({
                raw: true,
                attributes: ['block_date'],
                include: {
                    model: block,
                    required: true,
                    attributes: ['reason', 'duration', 'restrictions'],
                },
                where: { userId: req.user.id },
            });

            res.status(StatusCodes.OK).json({
                success: true,
                data: { allPermision, allRestrictions },
            });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                error: error.message,
            });
        }
    },
   
};


  //! account may be delete this router 
    //remove account
    // remove: async (req, res) => {
    //     // try {
    //     //     if (req.user.id === 1)
    //     //         throw Error(
    //     //             'لا يمكنك حذف هذا الحساب بسب انه الحساب الرئيسي للمدير الموقع'
    //     //         );
    //     //     //! here should use hooks before delete the user delete every thing about user and before delete the manger store delete should delete store and offer and other things about this store

    //     //     if (req.user.role.id === 3 || req.user.role.id === 4) {



    //     //         let storeInfo = await store.findOne({
    //     //             attributes:["stopShowInBox"],raw  :true,
    //     //             where: { userId: req.user.id },
    //     //         });
    //     //         if(storeInfo)
    //     //         {
    //     //             if(storeInfo.stopShowInBox)
    //     //         }
    //     //         ///if manger store
    //     //         let { err } = await removeManger(req, storeInfo, true);
    //     //         if (err) throw Error(err);
    //     //     } else {
    //     //         //if is other user
    //     //         await req.user.destroy({ force: true });
    //     //     }
    //     //     res.status(StatusCodes.OK).send({ success: true });
    //     // } catch (error) {
    //     //     res.status(StatusCodes.BAD_REQUEST).send({
    //     //         success: false,
    //     //         error: error.message,
    //     //     });
    //     // }
    // }


// /*

//    /*
//      * @employee
//      * @private
//      * @method POST
//      * @work add new employee
//      */
//     // get image
//     getImage: async (req, res) => {
//         try {
//             return res
//                 .status(StatusCodes.OK)
//                 .send({ success: true, data: req.user.avatar });
//         } catch (err) {
//             return res
//                 .status(StatusCodes.BAD_REQUEST)
//                 .send({ success: false, error: err.message });
//         }
//     },
//     /*
//      * @employee
//      * @private
//      * @method POST
//      * @work add new employee
//      */
//     //delete image
//     deleteImage: async (req, res) => {
//         try {
//             if (!req.user.avatar) throw Error('لا يوجد صورة ');
//             await users.update(
//                 { avatar: null },
//                 { where: { id: req.user.id } }
//             );

//             let str = req.user.avatar;
//             let serverIndex = str.indexOf('/images/');
//             removePic(path.join(path.resolve(), str.substring(serverIndex)));

//             res.status(StatusCodes.OK).send({
//                 success: true,
//                 msg: 'تمت عملية الحذف بنجاح',
//             });
//         } catch (err) {
//             res.status(StatusCodes.BAD_REQUEST).send({
//                 success: false,
//                 error: err.message,
//             });
//         }
//     },
//       /*
//      * @employee
//      * @private
//      * @method POST
//      * @work add new employee
//      */
//     //! image
//     //upload image
//     uploadImage: async (req, res, next) => {
//         try {
//             let userInfoAvatar = await users.findOne({
//                 attributes: ['avatar'],
//                 raw: true,
//                 where: { id: req.user.id, avatar: { [Op.not]: null } },
//             });
//             if (!req.file) throw Error('لا يوجد صورة الرجاء اختيار صورة');

//             // if user has image before
//             if (userInfoAvatar) {
//                 let str = userInfoAvatar.avatar;
//                 let serverIndex = str.indexOf('/images/');
//                 removePic(
//                     path.join(path.resolve(), str.substring(serverIndex))
//                 );
//             }
//             let filename = null;

//             //! convert image to jpeg
//             // if (req.file.mimetype !== 'image/jpeg') {
//             //     filename = await convertToJpeg(req.file.path, req);
//             // } else filename = req.file.filename;

//             await users.update(
//                 { avatar: process.env.LINK + `/images/${req.file.filename}` },
//                 { where: { id: req.user.id } }
//             );
//             //remove the image from the folder
//             if (fs.existsSync(req.user.avatar)) removePic(req.user.avatar);
//             res.status(StatusCodes.OK).send({ success: true });
//         } catch (err) {
//             if (fs.existsSync(req.file)) removePic(req.file.path);
//             res.status(StatusCodes.BAD_REQUEST).send({
//                 success: false,
//                 error: err.message,
//             });
//         }
//     },
// */