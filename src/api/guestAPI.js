// src/api/guestAPI.js - FIXED VERSION

import api from '../services/api';

const guestAPI = {
  submitApplication(formData) {
    // ✅ FIXED: Added /api/ prefix and proper headers for multipart/form-data
    return api.post('/guest/submit', formData, {
          timeout: 60000, // Increase to 60 seconds
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  trackApplications(trackingToken) {
    return api.get(`/api/guest/track/${trackingToken}`);
  }
};

export default guestAPI;



