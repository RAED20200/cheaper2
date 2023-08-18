import express from 'express';
const router = express.Router();
import control from '../controllers/dev.controllers.js';
import { schema } from '../validation/schema/dev.schema.js';
import { type, validate } from '../config/header_routers.js';

router.get(
    '/check-username',
    validate(schema.body.check_username, type.query),
    control.checkUsername
);
router.get(
    '/check-phone',
    validate(schema.body.check_phone, type.body),
    control.checKPhoneNumber
);

router.get(
    '/check-email',
    validate(schema.body.check_email, type.body),
    control.checKEmail
);

router.get('/all-category', control.allCategory);

export default router;
