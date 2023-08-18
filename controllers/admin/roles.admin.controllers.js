import { Op } from 'sequelize';
import _ from 'lodash';
import { INSUFFICIENT_SPACE_ON_RESOURCE, StatusCodes } from 'http-status-codes';
// MODELS
import { role } from '../../models/index.js';

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

export default {
    /*
     * @auth controllers
     * public
     * @method POST
     * @work sign in as manger store
     */
    //create role
    create: async (req, res) => {
        try {
            let roleInfo = await role.findOne({
                attributes: ['id'],
                where: {
                    name: req.body.name.trim(),
                },
            });
            if (roleInfo) throw Error('اسم الدور موجود مسبقا في القائمة ');

            let dataJson = JSON.stringify(_.omit(req.body, 'name'));
            await role.create({ name: req.body.name.trim(), data: dataJson });
            res.status(StatusCodes.CREATED).send({
                success: true,
                msg: `تم إنشاء الدور بنجاح`,
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
    //update roles
    update: async (req, res) => {
        try {
            let roleInfo = await role.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!roleInfo) throw Error('رقم الصلاحية غير صحيح ');

            if (req.params.id <= 5)
                throw Error(
                    'لا يمكنك التعديل على الصلاحيات الاساسية الموجودة في النظام '
                );

            roleInfo = await role.findOne({
                attributes: ['id'],

                where: {
                    name: req.body.name.trim(),
                    id: { [Op.not]: req.params.id },
                },
            });
            if (roleInfo) throw Error('اسم الدرو موجود من قبل ');

            let dataJson = JSON.stringify(_.omit(req.body, 'name'));

            await role.update(
                { name: req.body.name.trim(), data: dataJson },
                { where: { id: req.params.id } }
            );
            res.status(StatusCodes.OK).send({
                success: true,
                msg: `تمت عملية التحديث بنجاح`,
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
            if (req.params.id <= 5)
                throw Error(
                    'لا يمكنك حذف احدى الصلاحيات الاساسية الموجودة في النظام '
                );
            const roleInfo = await role.findByPk(req.params.id, {
                attributes: ['id'],
            });
            if (!roleInfo) throw Error('رقم الصلاحية غير صحيح ');

            await roleInfo.destroy({ force: true });
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
    //get all role
    getAllRole: async (req, res) => {
        try {
            let data = await role.findAll({ raw: true });

            data = data.map((infoRole) => {
                return {
                    id: infoRole.id,
                    name: infoRole.name,
                    data: JSON.parse(JSON.parse(infoRole.data)),
                };
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
