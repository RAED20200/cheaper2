import Joi from 'joi';
export const schema = {
    body: {
        addSpam: Joi.object({
            reasonSpam: Joi.string().required().trim(),
        }),
        addEvaluate: Joi.object({
            evaluates: Joi.number().integer().required().min(1).max(100),
        }),
        gift: Joi.object({
            username: Joi.string()
                .trim()
                .pattern(/[a-zA-Z]+[a-zA-Z0-9\_\.]*$/)
                .min(3)
                .max(30)
                .required(),
        }),
    },
    params: {
        id: Joi.object({
            id: Joi.number().integer().required().min(1).max(1e4),
        }),
        ids: Joi.object({
            ids: Joi.array().items(Joi.number().integer().min(1).max(1e4)),
        }),
    },
    query: {
        limited: Joi.object({
            size: Joi.number().integer().required().min(1).max(1e4),
            page: Joi.number().integer().required().min(1).max(1000),
        }),
        filterAndSearch: Joi.object({
            size: Joi.number().integer().required().min(1).max(1e7),
            page: Joi.number().integer().required().min(1).max(1000),
            search: Joi.string().max(75),
            category: Joi.array().items(Joi.number().integer().min(1).max(1e7)),

            type: Joi.string()
                .valid(...Object.values({ free: 'free', pro: 'pro' }))
                .required(),
        }),
    },
};
