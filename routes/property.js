const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('../config/cloudinary.cfg');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middlewares/auth.mid');
const { uploadLimiter } = require('../middlewares/ratelimiter.mid');
const Property = require('../models/property.model');
const connectDB = require('../config/db.cfg');

// Ensure DB connection
router.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => ({
    folder: `rentsetu/${file.fieldname}`,
    public_id: `${Date.now()}-${file.originalname}`,
    resource_type: file.mimetype.startsWith('image') ? 'image' : 'raw',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
  })
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF allowed.'));
    }
  }
});

// Upload middleware for multiple fields
const uploadFields = upload.fields([
  { name: 'identityProof', maxCount: 2 },
  { name: 'ownershipProof', maxCount: 2 },
  { name: 'propertyPhotos', maxCount: 10 },
  { name: 'floorPlan', maxCount: 2 }
]);

router.post('/register', auth, uploadLimiter, uploadFields, [
  check('personalDetails.fullName', 'Full name is required').notEmpty(),
  check('personalDetails.email', 'Please include a valid email').isEmail(),
  check('personalDetails.contactNo', 'Contact number is required').notEmpty(),
  check('propertyDetails.propertyAddressLine1', 'Property address is required').notEmpty(),
  check('propertyDetails.propertyCity', 'Property city is required').notEmpty(),
  check('propertyDetails.propertyState', 'Property state is required').notEmpty(),
  check('propertyDetails.propertyPincode', 'Property pincode is required').notEmpty(),
  check('propertyDetails.propertyName', 'Property name is required').notEmpty(),
  check('propertyDetails.propertyType', 'Property type is required').notEmpty(),
  check('propertyDetails.bhkType', 'BHK type is required').notEmpty(),
  check('propertyDetails.furnishingStatus', 'Furnishing status is required').notEmpty(),
  check('propertyDetails.propertyPrice', 'Property price is required').isNumeric(),
  check('propertyDetails.securityDeposit', 'Security deposit is required').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const documents = {
      identityProof: req.files['identityProof']?.map(file => file.path) || [],
      ownershipProof: req.files['ownershipProof']?.map(file => file.path) || [],
      propertyPhotos: req.files['propertyPhotos']?.map(file => file.path) || [],
      floorPlan: req.files['floorPlan']?.map(file => file.path) || []
    };

    const property = new Property({
      userId: req.user.userId,
      personalDetails: JSON.parse(req.body.personalDetails),
      propertyDetails: JSON.parse(req.body.propertyDetails),
      documents
    });

    await property.save();
    res.status(201).json({ message: 'Property registered successfully', property });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-properties', auth, async (req, res) => {
  try {
    const properties = await Property.find({ userId: req.user.userId });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;