import Joi from 'joi';
import { enumGender } from '../../../utils/enums.js';
import moment from 'moment';
export const schema = {
    body: {
        userInfo: Joi.object({
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
            category: Joi.array()
                .items(Joi.string().trim().max(30).required())
                .min(3),
            avatar: Joi.string().empty(Joi.allow(null)),
            password: Joi.string().empty(Joi.allow(null)).min(8).max(50),
        }),
        unblockIds: Joi.object({
            //array of the category
            unblockIds: Joi.array().items(Joi.number().integer()).required(),
        }),
    },
    params: {
        idJust: Joi.object({ id: Joi.number().required() }),
    },
    query: {
        limited: Joi.object({
            size: Joi.number().integer().required().min(1).max(1e4),
            page: Joi.number().integer().required().min(1).max(1000),
        }),
        block: Joi.object({
            userId: Joi.number().required(),
            blockId: Joi.number().required(),
        }),
        filter: Joi.object({
            size: Joi.number().integer().required().min(1).max(1e7),
            page: Joi.number().integer().required().min(1).max(1000),
            search: Joi.string().max(75),
            gender: Joi.string().valid(...Object.values(enumGender)),
            blocked: Joi.boolean(),
            active: Joi.boolean(),
        }),
    },
};
