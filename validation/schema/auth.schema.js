import Joi from 'joi';
import { enumGender } from '../../utils/enums.js';
export const schema = {
    //login
    logIn: Joi.object({
        username: Joi.string()
            .trim()
            .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
            .min(3)
            .max(30)
            .required(),
        password: Joi.string().required().min(8).max(50),
        tokenDevice: Joi.string().required().trim().min(20).max(400),
    }),
    //sign in for normal user
    signInUser: Joi.object({
        name: Joi.string().required().min(2).max(50).trim(),
        gender: Joi.string()
            .valid(...Object.values(enumGender))
            .required(),
        category: Joi.array()
            .items(Joi.string().trim().min(1).max(50))
            .min(3)
            .required(),
        phoneNumber: Joi.string()
            .trim()
            .required()
            .pattern(/^(09)(\d{8})$/),
        birthday: Joi.date().required(),
        username: Joi.string()
            .trim()
            .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
            .min(3)
            .max(30)
            .required(),
        password: Joi.string().required().min(8).max(50),
        tokenDevice: Joi.string().required().trim().min(20).max(400),
    }),
    //sign in for manger store
    signInManger: Joi.object({
        //user info
        name: Joi.string().required().min(2).max(50).trim(),
        gender: Joi.string()
            .valid(...Object.values(enumGender))
            .required(),
        email: Joi.string()
            .trim()
            .pattern(/[a-zA-Z0-9\_\.]+(@gmail\.com)$/)
            .allow(null),
        phoneNumber: Joi.string()
            .trim()
            .required()
            .pattern(/^(09)(\d{8})$/),
        username: Joi.string()
            .trim()
            .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
            .min(3)
            .max(30)
            .required(),
        locationText: Joi.string().allow(null),
        password: Joi.string().required().min(8).max(50),
        //store info
        nameStore: Joi.string().required().min(3).max(50).trim(),
        longitude: Joi.number().required(),
        latitude: Joi.number().required(),
        city: Joi.string().required(),
        fromHour: Joi.number().required().min(1).max(12),
        tokenDevice: Joi.string().required().trim().min(20).max(400),

        toHour: Joi.number().required().min(1).max(12),
        category: Joi.string().required().trim(),
    }),
};
