// src/api/guestAPI.js - COMPLETE WITH ALL ENDPOINTS

import api from '../services/api';

const guestAPI = {
  /**
   * Submit guest application
   */
  submitApplication(formData) {
    return api.post('/api/guest/submit', formData, {
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Track applications using tracking token
   */
  trackApplications(trackingToken) {
    return api.get(`/api/guest/track/${trackingToken}`);
  },

  /**
   * Review a job match (approve/reject)
   */
  reviewMatch(trackingToken, matchId, approved) {
    return api.put(`/api/guest/track/${trackingToken}/review-match/${matchId}`, {
      approved
    });
  }
};

export default guestAPI;