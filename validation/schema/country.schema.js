import Joi from 'joi';
export const schema = {
    body: Joi.object({
        name: Joi.string().required().trim(),
    }),
    params: Joi.object({ id: Joi.number().required() }),
    query: {},
};
