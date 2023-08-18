import Joi from 'joi';
import moment from 'moment';
import { enumGender } from '../../utils/enums.js';
export const schema = {
    body: {
        update: Joi.object({
            name: Joi.string().required().min(2).max(50).trim(),
            gender: Joi.string()
                .valid(...Object.values(enumGender))
                .required(),
            birthday: Joi.date()
                .required()
                .max(moment())
                .min(moment('1970-01-01')),
            username: Joi.string()
                .trim()
                .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
                .min(3)
                .max(30)
                .required(),
             category: Joi.array().items(Joi.string().trim().max(30).required()),
            avatar: Joi.string().empty(Joi.allow(null)),
        }),
        //disable or delete or check if user here
        category: Joi.object({
            //array of the category
            category: Joi.array().items(Joi.string().trim()).required(),
        }),
        ch_phon: Joi.object({
            phoneNumber: Joi.string().required().trim(),
        }),
        ch_email: Joi.object({
            newEmail: Joi.string()
                .required()
                .trim()
                .pattern(/[a-zA-Z0-9\_\.]+(@gmail\.com)$/),
            password: Joi.string().required(),
        }),
        verify_email: Joi.object({
            newEmail: Joi.string()
                .required()
                .trim()
                .pattern(/[a-zA-Z0-9\_\.]+(@gmail\.com)$/),
            code: Joi.string()
                .pattern(/(\d{6})$/)
                .trim()
                .required(),
        }),
        changePassword: Joi.object({
            password: Joi.string().required().min(8).max(50),
            newPassword: Joi.string().required().min(8).max(50),
        }),
    },
    query: {
        notification: Joi.object({
            page: Joi.number().integer().required().min(1).max(1e5),
            size: Joi.number().integer().required().min(1).max(1e4),
        }),
    },
};
