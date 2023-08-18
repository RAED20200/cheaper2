import Joi from 'joi';
export const schema = {
    body: Joi.object({
        name: Joi.string().required().trim().min(1).max(75),
        checkWithImageOrNot: Joi.boolean().required(),
        nameEmo: Joi.string().required().min(1).max(50),
    }),
    params: Joi.object({ id: Joi.number().required().min(1).max(1e7) }),
    query: {},
};
