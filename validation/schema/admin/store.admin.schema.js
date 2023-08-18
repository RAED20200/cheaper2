import Joi from 'joi';
export const schema = {
    body: Joi.object({
        name: Joi.string().required().min(3).max(50).trim(),
    }),
    params: {
        idJust: Joi.object({ id: Joi.number().required() }),
    },
    query: {
        limited: Joi.object({
            size: Joi.number().integer().required().min(1).max(1e4),
            page: Joi.number().integer().required().min(1).max(1000),
        }),
    },
};
