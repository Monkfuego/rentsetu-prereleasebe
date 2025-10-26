const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  personalDetails: {
    fullName: { type: String, required: true },
    contactNo: { type: String, required: true },
    alternateContactNo: { type: String },
    email: { type: String, required: true },
    currentAddressLine1: { type: String, required: true },
    currentAddressLine2: { type: String },
    currentCity: { type: String, required: true },
    currentState: { type: String, required: true },
    currentPincode: { type: String, required: true },
    communicationMode: [{ type: String }]
  },
  propertyDetails: {
    propertyAddressLine1: { type: String, required: true },
    propertyAddressLine2: { type: String },
    propertyCity: { type: String, required: true },
    propertyState: { type: String, required: true },
    propertyPincode: { type: String, required: true },
    propertyName: { type: String, required: true },
    propertyType: { type: String, required: true },
    bhkType: { type: String, required: true },
    furnishingStatus: { type: String, required: true },
    propertyPrice: { type: Number, required: true },
    securityDeposit: { type: Number, required: true },
    amenities: [{ type: String }]
  },
  documents: {
    identityProof: [{ type: String }], 
    ownershipProof: [{ type: String }],
    propertyPhotos: [{ type: String }],
    floorPlan: [{ type: String }]
  }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);