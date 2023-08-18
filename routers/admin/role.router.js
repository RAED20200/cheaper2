import express from 'express';
const router = express.Router();
import control from '../../controllers/Admin/roles.admin.controllers.js';
import { schema } from '../../validation/Schema/role.schema.js';
import {
    auth,
    access,
    permissions,
    type,
    validate,
} from '../../config/header_routers.js';
import { lockRouter } from '../../middleware/lockRouter.js';

//create role
router.post(
    '/create',
    // access(permissions.role.create),
    validate(schema.body, type.body),
    control.create
);

//update
router.put(
    '/update/:id',
    auth,
    // access(permissions.role.update),
    validate(schema.params, type.params),
    validate(schema.body, type.body),
    control.update
);

//remove
router.delete(
    '/delete/:id',
    auth,
    // access(permissions.role.delete),
    validate(schema.params, type.params),
    control.remove
);

//get all role
router.get(
    '/get-all-role',
    // auth,
    // access(permissions.role.all),
    control.getAllRole
);
export default router;
