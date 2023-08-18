import express from 'express';
const router = express.Router();
import control from '../../controllers/admin/user.admin.controller.js';
import { schema } from '../../validation/Schema/admin/user.admin.schema.js';
import {
    auth,
    access,
    permissions,
    type,
    validate,
} from '../../config/header_routers.js';
import { lockRouter } from '../../middleware/lockRouter.js';
import { uploadImage } from '../../middleware/uploadImage.js';

// router.get(
//     '/',
//     auth,
//     // access(permissions.user.all),
//     validate(schema.query.limited, type.query),
//     control.getUsers
// );
router.get(
    '/',
    auth,
    // access(permissions.store.all),
    // validate(schema.body, type.body),

    validate(schema.query.filter, type.query),
    control.getUsersAndFilterAndSearch
);
router.delete(
    '/delete/:id',
    auth, // access(permissions.user.all),
    validate(schema.params.idJust, type.params),
    control.deleteUser
);
router.put(
    '/update/:id',
    auth,
    // access(permissions.user.all),
    uploadImage('avatar', 'single'),
    validate(schema.body.userInfo, type.body),
    validate(schema.params.idJust, type.params),
    control.updateUser
);
router.get(
    '/statisticsInfo',
    auth,
    // access(permissions.store.all),
    // validate(schema.body, type.body),

    control.statisticsInfo
);

router.get(
    '/block',
    auth,
    // access(permissions.store.all),
    // validate(schema.body, type.body),
    validate(schema.query.block, type.query),
    control.blockUser
);
router.get(
    '/unblock',
    auth,
    // access(permissions.store.all),
    // validate(schema.body, type.body),
    validate(schema.query.block, type.query),
    control.unBlockUser
);
router.get(
    '/deleteMultiBlock/:id',
    auth,
    // access(permissions.store.all),
    validate(schema.params.idJust, type.params),
    validate(schema.body.unblockIds, type.body),
    control.deleteBlockRecent
);

router.get(
    '/allBlockUser/:id',
    auth,
    // access(permissions.store.all),
    // validate(schema.body, type.body),
    validate(schema.params.idJust, type.params),
    control.allBlockAboutUser
);

export default router;
