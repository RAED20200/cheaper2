import Joi from 'joi';

export const schema = {
    body: {
        modify: Joi.object({
            title: Joi.string().required().max(150),
            discount: Joi.number().required().min(7).max(99),
            description: Joi.string().required().max(300),
        }),
        verify: Joi.object({
            QR: Joi.string().required().trim(),
        }),
    },

    params: Joi.object({ id: Joi.number().required() }),

    query: {},
};
