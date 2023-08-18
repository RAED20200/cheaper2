import express from 'express';
const router = express.Router();
import control from '../../controllers/Admin/store.admin.controller.js';
import { schema } from '../../validation/Schema/admin/store.admin.schema.js';
import {
    auth,
    access,
    permissions,
    type,
    validate,
} from '../../config/header_routers.js';
import { lockRouter } from '../../middleware/lockRouter.js';

// get all store
router.get(
    '/all-store',
    auth,
    // access(permissions.store.all),
    control.getAllStore
);

// get all store
router.get(
    '/all-new',
    auth,
    // access(permissions.store.all),
    control.getAllNew
);
// get all store
router.put(
    '/accept-store',
    auth,
    // access(permissions.store.all),
    validate(schema.body, type.body),

    control.acceptStore
);
// get all store
router.delete(
    '/delete-store',
    auth,
    // access(permissions.store.all),
    validate(schema.body, type.body),
    control.deleteStore
);
export default router;
