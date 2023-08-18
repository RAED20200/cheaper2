import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';
import { role, user } from '../../models/index.js';
export default {
    /*
     * @employee
     * @private
     * @method POST
     * @work add new employee
     */
    add: async (req, res) => {
        try {
            let user1 = await user.findOne({
                attributes: ['id'],
                where: {
                    [Op.or]: [
                        { phoneNumber: req.body.phoneNumber.trim() },
                        { username: req.body.username.trim() },
                    ],
                },
            });
            if (user1) throw Error('اسم المستخدم او رقم الهاتف موجود سابقا ');

            let response = await user.create({
                ...req.body,
                roleId: 6,
                user_settings: process.env.USER_SETTINGS,
            });
            res.status(StatusCodes.CREATED).send({
                success: true,
                data: response.id,
                msg: `تم إنشاء بنجاح`,
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
     * @method PUT
     * @work update employee
     */
    update: async (req, res) => {
        try {
            let myUser = await user.findOne({
                attributes: ['id'],
                where: { id: req.params.id },
            });
            if (!myUser) throw Error('رقم المستخدم غير صحيح');

            if (req.role.id !== 1 && myUser.roleId === 1)
                throw Error('غير مصرح لك اجراء عمليةالتعديل');

            let myRole = await role.findOne({
                attributes: ['id'],
                where: {
                    name: req.body.nameRole.trim(),
                },
            });
            if (!myRole) throw Error('اسم الدور غير صحيح ');

            let user1 = await user.findOne({
                attributes: ['id'],
                where: {
                    username: req.body.username.trim(),
                    id: { [Op.not]: req.params.id },
                },
            });
            if (user1) throw Error('اسم المستخدم  موجود سابقا ');

            await user.update(
                {
                    ...req.body,
                    roleId: myRole.id,
                },
                {
                    where: { id: req.params.id },
                }
            );

            res.status(StatusCodes.OK).send({
                success: true,
                msg: `تم التحديث بنجاح`,
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
     * @method DELETE
     * @work delete employee
     */

    delete: async (req, res) => {
        try {
            let deleteEmployee = await user.findOne({
                attributes: ['id'],
                where: {
                    id: req.params.id,
                },
            });
            if (!deleteEmployee) throw Error('بعض الادخالات خاطئة');

            if (req.role.id != 1 && deleteEmployee.roleId == 1)
                throw Error('غير مصرح لك اجراء عملية الحذف');

            await deleteEmployee.destroy({ force: true });
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
     * @method GET
     * @work all employee
     */
    getAll: async (req, res) => {
        try {
            let allInfo = await user.findAll({
                attributes: [
                    'id',
                    'name',
                    'gender',
                    'email',
                    'phoneNumber',
                    'birthday',
                    'username',
                    'avatar',
                ],
            });
            res.status(StatusCodes.OK).send({ success: true, data: allInfo });
        } catch (err) {
            res.status(StatusCodes.BAD_REQUEST).send({
                success: false,
                error: err.message,
            });
        }
    },
};
