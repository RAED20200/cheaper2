import Joi from 'joi';
export const schema = {
    body: {
        get_spams: Joi.object({
            nameStore: Joi.string().required().trim(),
        }),
    },
    params: Joi.object({ id: Joi.number().required() }),
    query: {},
};
