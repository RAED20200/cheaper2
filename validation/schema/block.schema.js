import Joi from 'joi';

export const schema = {
    body: {
        modify: Joi.object({
            reason: Joi.string().max(150).required().trim(),
            restrictions: Joi.object({
                show: Joi.array()
                    .items(Joi.string().trim().max(100))
                    .required(),
                action: Joi.array()
                    .items(Joi.string().trim().max(100))
                    .required(),
            }).required(),
            duration: Joi.number().integer().min(1).max(1e4).required(),
        }),
        blocking: Joi.object({
            userId: Joi.number().required(),
            banListId: Joi.number().required(),
        }),
    },
    params: Joi.object({ id: Joi.number().required() }),
    query: {},
};
