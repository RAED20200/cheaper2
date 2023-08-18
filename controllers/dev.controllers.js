import _ from 'lodash';
import { StatusCodes } from 'http-status-codes';

//MODELS
import { user, category } from '../models/index.js';

export default {
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    checkUsername: async (req, res) => {
        try {
            let usernameCheck = await user.findOne({
                raw: true,
                attributes: ['avatar', 'name', 'username'],
                where: { username: req.query.username },
            });
            if (!usernameCheck) throw Error('اسم المستخدم غير موجود');

            res.status(StatusCodes.OK).send({
                success: false,
                data: usernameCheck,
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
    checKPhoneNumber: async (req, res) => {
        try {
            if (
                await user.findOne({
                    where: { phoneNumber: req.body.phoneNumber.trim() },
                    attributes: ['id'],
                })
            )
                throw Error('رقم الهاتف موجود سابقا');
            res.status(StatusCodes.OK).send({ success: true });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).send({
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
    checKEmail: async (req, res) => {
        try {
            if (
                await user.findOne({
                    where: { email: req.body.email.trim() },
                    attributes: ['id'],
                })
            )
                throw Error('لايميل موجود سابقا');

            res.status(StatusCodes.OK).send({ success: true });
        } catch (error) {
            res.status(StatusCodes.BAD_REQUEST).send({
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
    allCategory: async (req, res) => {
        try {
            let data = await category.findAll({
                raw: true,
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
