import Joi from 'joi';
export const schema = {
    body: {
        check_phone: Joi.object({
            phoneNumber: Joi.string()
                .trim()
                .required()
                .pattern(/^(09)(\d{8})$/),
        }),
        check_username: Joi.object({
            username: Joi.string()
                .trim()
                .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
                .min(3)
                .max(30)
                .required(),
        }),
        check_email: Joi.object({
            email: Joi.string()
                .trim()
                .pattern(/[a-zA-Z0-9\_\.]+(@gmail\.com)$/)
                .allow(null),
        }),
    },
    params: {},
    query: {
        checkUsername: Joi.object({
            username: Joi.string()
                .trim()
                .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
                .min(3)
                .max(30)
                .required(),
        }),
    },
};
