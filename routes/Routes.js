import express from 'express';
import { bulkRegisterUsers, createEvent, generateMagicLink, getAllEvents, getEventById, getUsersByEventId, removeAdminEvent, updateEmailContent, updateUserEvent, verifyMagicLink } from '../controllers/controller.js';

export const router=express.Router();

router.post('/createevent',createEvent)
router.get('/getEvents',getAllEvents)
router.get('/getid',getEventById)
router.post('/sendqr',bulkRegisterUsers)
router.post('/create/magiclink',generateMagicLink)
router.post('/verify/magiclink',verifyMagicLink)
router.post('/update/user/event',updateUserEvent)
router.get('/analysis',getUsersByEventId)
router.post('/remove/admin',removeAdminEvent)
router.post('/event/email',updateEmailContent)








