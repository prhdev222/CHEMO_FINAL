const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const linksController = require('../controllers/linksController');

// GET all links
router.get('/', authenticateToken, linksController.getAllLinks);
// POST a new link
router.post('/', authenticateToken, authorizeRoles('ADMIN'), linksController.createLink);
// PUT update a link
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), linksController.updateLink);
// DELETE a link
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), linksController.deleteLink);

module.exports = router; 