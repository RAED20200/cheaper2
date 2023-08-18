import express from 'express';
const router = express.Router();
import control from '../../controllers/Admin/home.admin.controller.js';
import {
    auth,
    access,
    permissions,
    type,
    validate,
} from '../../config/header_routers.js';
import { lockRouter } from '../../middleware/lockRouter.js';

//get all
router.get('/', auth, control.getCount);
export default router;
