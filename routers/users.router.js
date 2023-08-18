import express from 'express';
const router = express.Router();
import control from '../controllers/users.controllers.js';
import { schema } from '../validation/schema/user.schema.js';
import { auth, validate, type } from '../config/header_routers.js';

router.post(
    '/add-spam/:id',
    auth,
    // access(),
    // lockRouter(permissions.ban_list.create),

    validate(schema.params.id, type.params),
    validate(schema.body.addSpam, type.body),
    control.addSpam
);
router.post(
    '/add-evaluate/:id',
    auth,
    // access(),
    // lockRouter(permissions.ban_list.create),

    validate(schema.params.id, type.params),
    validate(schema.body.addEvaluate, type.body),
    control.addEvaluate
);

router.get(
    '/myOffer',
    auth,
    // access(),
    // lockRouter(permissions.ban_list.create),
    validate(schema.query.limited, type.query),
    control.allMyOffer
);
router.get(
    '/gifted',
    auth,
    // access(),
    // lockRouter(permissions.ban_list.create),
    validate(schema.query.limited, type.query),
    control.allOfferGifted
);

router.get(
    '/choose-offer',
    auth,
    // access(),
    // lockRouter(permissions.ban_list.create),
    control.chooseOffer
);

router.put(
    '/gift/:id',
    auth,
    // access(),
    validate(schema.params.id, type.params),
    validate(schema.body.gift, type.body),
    control.gift
);

router.get(
    '/evaluation/:id',
    auth,
    // access(),
    validate(schema.params.id, type.params),
    validate(schema.query.limited, type.query),
    control.getEvaluateUser
);
router.get(
    '/filter/offer',
    auth,
    // access(),
    validate(schema.query.filterAndSearch, type.query),
    control.filterOffer
);
router.get(
    '/filter/gifted',
    auth,
    // access(),
    validate(schema.query.filterAndSearch, type.query),
    control.filterGifted
);

export default router;
