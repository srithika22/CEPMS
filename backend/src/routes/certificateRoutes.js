const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { protect, checkCoordinator } = require('../middleware/auth');

// Public routes
router.get('/verify/:verificationCode', certificateController.verifyCertificate);
router.get('/:id', certificateController.getCertificateById);

// Protected routes
router.use(protect);

// User routes
router.get('/user/my-certificates', certificateController.getMyCertificates);
router.post('/:id/download', certificateController.trackDownload);

// Coordinator/Admin routes
router.post('/generate', checkCoordinator, certificateController.generateCertificate);
router.post('/bulk-generate', checkCoordinator, certificateController.bulkGenerateCertificates);
router.get('/event/:eventId', checkCoordinator, certificateController.getEventCertificates);

module.exports = router;
