// import Filter from 'bad-word-ar';
import { enumGender } from '../../../utils/enums.js';

// const filterAr = new Filter('ar');
// const filterEn = new Filter('en');
import Joi from 'joi';
let message = 'بعض الحقول تحتوي على كلمات نابية، الرجاء التقيد باداب النص';

export let schema = {
    body: {
        modify: Joi.object({
            //manger info
            name: Joi.string().required().min(2).max(50).trim(),
            // .custom((value, helpers) => {
            //     if (filterAr.check(value) || filterEn.check(value))
            //         return helpers.message(message);
            //     else return value;
            // }),
            gender: Joi.string()
                .valid(...Object.values(enumGender))
                .required(),
            email: Joi.string()
                .trim()
                .pattern(/[a-zA-Z0-9]+[a-zA-Z0-9\_\.]*(@gmail\.com)$/)
                .allow(null),
                email:Joi.string().allow(null).pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
         
            phoneNumber: Joi.string()
                .trim()
                .required()
                .pattern(/^(09)(\d{8})$/),

            username: Joi.string()
                .trim()
                .pattern(/^[A-Za-z]+[a-zA-Z0-9\_\.]*$/)
                .min(3)
                .max(30)
                .required(),
            // .custom((value, helpers) => {
            //     if (filterAr.check(value) || filterEn.check(value))
            //         return helpers.message(message);
            //     else return value;
            // }),
            password: Joi.string().required().min(8).max(50),
            // .custom((value, helpers) => {
            //     if (filterAr.check(value) || filterEn.check(value))
            //         return helpers.message(message);
            //     else return value;
            // }),
            nameRole: Joi.string().required().trim(),
            // .custom((value, helpers) => {
            //     if (filterAr.check(value) || filterEn.check(value))
            //         return helpers.message(message);
            //     else return value;
            // }),
        }),
    },
    params: Joi.object({
        id: Joi.number().integer().min(1),
    }),
    query: {},
};
