import { Op } from 'sequelize';
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';
import useragent from 'useragent';

//UTILS
import { compare } from '../utils/bcrypt.js';
import { createToken } from '../utils/jwt.js'; 

//CONTROLLER
import controlStore from './stores.controllers.js';
import controlUser from './users.controllers.js';

// MODELS
import {
    user as users,
    role, 
    token as tokenTable,
} from '../models/index.js';

/*
///basic roles in system :
  1 Admin 
  2 User
  3 Manger new 
  4 Manger saved
  5 manger country 
#this roles can't any one edit or delete them 
#but other role can edit on it 
*/

let setToken = async (req, id) => {
    let agent = useragent.parse(req.headers['user-agent']);
    const token = createToken(req, { id });
    await tokenTable.create({
        token,
        browser: agent.family,
        tokenDevice: req.body.tokenDevice.trim(),
        system: agent.os.toString(),
        device: agent.device.toString(),
        userId: id,
        expiresAt: moment().add(90, 'days').format('YYYY-MM-DD h:mm:ss'),
    });

    // res.cookie("cheaper-token", token, {
    //   //90 day
    //   //day * hour * minute * second * mile second
    //   maxAge: 90 * 24 * 60 * 60 * 1000,
    //   httpOnly: true,
    // });
    // res.cookie("cheaper-checkToken", true, {
    //   //day * hour * minute * second * mile second
    //   maxAge: 90 * 24 * 60 * 60 * 1000,
    // });
    return token;
};
export default {
    /*
     * @auth
     * @public
     * @method POST
     * @work sign up user
     */
    signUpUser: async (req, res) => {
        try {
            let user = await users.findOne({
                attributes: ['id'],
                where: {
                    [Op.or]: [
                        { username: req.body.username.trim() },
                        { phoneNumber: req.body.phoneNumber.trim() },
                    ],
                },
            });
            if (user) throw Error("اسم المستخدم او رقم الهاتف موجود سابقا");

            //create user
            var newUser = await users.create({
                //because role id for user is 2
                roleId: 2,
                ...req.body,
                counter: process.env.countOfferToGift,
                user_settings: process.env.USER_SETTINGS,
            });

            ///create interests
            let { error } = await controlUser.setInterests(req, newUser);
            if (error) {
                //delete this user from database
                await newUser.destroy({ force: true });
                throw Error(error);
            }
            let token = await setToken(req, newUser.id);

             //done created
            res.status(StatusCodes.CREATED).send({
                success: true,
                data: {
                    token,
                    },
            });
        } catch (error) {
            //return error to user
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @auth
     * @public
     * @method POST
     * @work sign up manager
     */
    signUpManger: async (req, res) => {
        try {
            let user = await users.findOne({
                attributes: ['id'],
                where: {
                    [Op.or]: [
                        { username: req.body.username.trim() },
                        { phoneNumber: req.body.phoneNumber.trim() },
                    ],
                },
            });
            if (user) {
                throw Error('اسم المستخدم او ارقام الهاتف موجودة لحساب اخر ');
            }
            //?create manger (User) account
            var manger = await users.create({
                //because role id for new manger is 3 ,after accepted from the admin  then change role (for allow to manger to modify offer )
                roleId: 3,
                ...req.body,
                user_settings: process.env.USER_SETTINGS,
            });

            //? create store
            let result = await controlStore.createStore(req, manger);

            if (result.error) {
                //for remove every avatars uploaded because error happen
                //delete this user from database
                await manger.destroy({ force: true });
                throw Error(result.error);
            }
            // for (let i = 0; i < req.files.length; i++) {
            //     str = req.files[i].path;
            //     serverIndex = str.indexOf('\\upload');
            //     if (serverIndex !== -1)
            //         req.files[i].path = str.substring(serverIndex);
            // }
            // let moreInfo = JSON.stringify({
            //     avatarIdentity1: req.files[0].path,
            //     avatarIdentity2: req.files[1].path,
            // });
            // await users.update({ moreInfo }, { where: { id: manger.id } });

            let token = await setToken(req, manger.id);
 
            // should to put the pack for this store when  admin accepted this store manger
            // await packsStore.create({ storeId: result.myStore.id, packId: 1 });

            //done created
            res.status(StatusCodes.CREATED).send({
                success: true,
                data: {
                    token,
                },
            });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @auth
     * @public
     * @method POST
     * @work login
     */
    login: async (req, res) => {
        try {
            const myInfo = await users.findOne({
                where: { username: req.body.username.trim() },
                attributes: ['disableAt', 'id', 'password'],
                include: {
                    model: role,
                    required: true,
                    attributes: ['name', 'data'],
                },
                paranoid: false,
            });

            //if not found user like this username
            if (!myInfo) throw Error('اسم المستخدم غير صحيح');

            //compare password
            const validPassword = await compare(
                req.body.password,
                myInfo.password
            );
            if (!validPassword) throw Error('كلمة المرور غير صحيحة ');

            //if user account is disable before then reactive this account
            if (myInfo.disableAt) await myInfo.restore();

            let token = await setToken(req, myInfo.id);

            res.status(StatusCodes.OK).send({
                success: true,
                data: {
                    token, 
                },
            });
        } catch (error) {
            //throw error to user
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: error.message,
            });
        }
    },
    /*
     * @auth
     * @public
     * @method GET
     * @work logout
     */
    logout: async (req, res) => {
        try {
            //delete token access
            let agent = useragent.parse(req.headers['user-agent']);

            let token = await tokenTable.findOne({
                attributes: ['id'],
                where: {
                    browser: agent.family,
                    device: agent.device.toString(),
                    userId: req.user.id,
                },
            });

            if (!token) throw Error('هذا الحساب مسجل خروج من هذا المتصفح ');

            token.destroy({ force: true });

            // res.clearCookie('cheaper-token');
            // res.cookie('cheaper-checkToken', false, {});
            res.status(StatusCodes.OK).send({
                success: true,
                msg: 'تم تسجيل الخروج بنجاح ',
            });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: error.message,
            });
        }
    },
};
