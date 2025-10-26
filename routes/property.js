const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const multer = require('multer');
const cloudinary = require('../config/cloudinary.cfg');
const streamifier = require('streamifier'); 
const auth = require('../middlewares/auth.mid');
const { uploadLimiter } = require('../middlewares/ratelimiter.mid');
const Property = require('../models/property.model');
const connectDB = require('../config/db.cfg');

router.use(async (req, res, next) => {
  await connectDB();
  next();
});

const storage = multer.memoryStorage(); 

const upload = multer({
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, PDF allowed.'));
    }
  }
});

const uploadFields = upload.fields([
  { name: 'identityProof', maxCount: 2 },
  { name: 'ownershipProof', maxCount: 2 },
  { name: 'propertyPhotos', maxCount: 10 },
  { name: 'floorPlan', maxCount: 2 }
]);

const validationMiddleware = [
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
];

const streamUpload = (file, fieldName) => {
  return new Promise((resolve, reject) => {
    const resourceType = file.mimetype.startsWith('image') ? 'image' : 'raw';
    
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `rentsetu/${fieldName}`,
        public_id: `${Date.now()}-${file.originalname}`,
        resource_type: resourceType
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

const uploadFieldFiles = async (files, fieldName) => {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadPromises = files.map(file => streamUpload(file, fieldName));
  
  const results = await Promise.all(uploadPromises);
  
  return results.map(result => result.secure_url);
};


router.post('/register', auth, uploadLimiter, uploadFields, validationMiddleware, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
   
    const [identityPaths, ownershipPaths, photoPaths, floorPlanPaths] = await Promise.all([
      uploadFieldFiles(req.files['identityProof'], 'identityProof'),
      uploadFieldFiles(req.files['ownershipProof'], 'ownershipProof'),
      uploadFieldFiles(req.files['propertyPhotos'], 'propertyPhotos'),
      uploadFieldFiles(req.files['floorPlan'], 'floorPlan')
    ]);

    const documents = {
      identityProof: identityPaths,
      ownershipProof: ownershipPaths,
      propertyPhotos: photoPaths,
      floorPlan: floorPlanPaths
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
    console.error('Error during property registration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/my-properties', auth, async (req, res) => {
  try {
    const properties = await Property.find({ userId: req.user.userId });
    res.json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;