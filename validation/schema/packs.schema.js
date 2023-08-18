import Joi from 'joi';
export const schema = {
    body: Joi.object({
        name: Joi.string().required().trim(),
        duration: Joi.number().required(),
        price: Joi.number().required(),
    }),
    params: Joi.object({ id: Joi.number().required() }),
    query: {},
};
