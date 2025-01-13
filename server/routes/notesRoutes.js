const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const notePageController = require('../controllers/notePageController');

router.get('/note', isLoggedIn, notePageController.noteDashboard);
router.get('/note/item/:id', isLoggedIn, notePageController.ViewNote);
router.put('/note/item/:id', isLoggedIn, notePageController.UpdateNote);
router.delete('/note/item-delete/:id', isLoggedIn, notePageController.DeleteNote);
router.get('/note/add', isLoggedIn, notePageController.AddNote);
router.post('/note/add', isLoggedIn, notePageController.AddNoteSubmit);
router.get('/note/search', isLoggedIn, notePageController.SearchNote);
router.post('/note/search', isLoggedIn, notePageController.SearchNoteSubmit);

module.exports = router;