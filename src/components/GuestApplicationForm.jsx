// src/components/GuestApplicationForm.jsx - COMPLETE WITH REDIRECT

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import guestAPI from '../api/guestAPI';
import { Upload, FileText, CheckCircle, Loader } from 'lucide-react';

const GuestApplicationForm = () => {
  const navigate = useNavigate();
  const { addTrackingToken, enableGuestMode } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    jobTitles: '',
    remotePreference: 'any'
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const validTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        setResumeFile(null);
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        setResumeFile(null);
        return;
      }
      
      setResumeFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.firstName.trim()) {
      setError('First name is required');
      return;
    }
    
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    
    if (!resumeFile) {
      setError('Please upload your CV');
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const payload = new FormData();
      payload.append('firstName', formData.firstName.trim());
      payload.append('lastName', formData.lastName.trim());
      payload.append('email', formData.email.trim());
      payload.append('phone', formData.phone.trim());
      payload.append('location', formData.location.trim());
      payload.append('jobTitles', formData.jobTitles.trim());
      payload.append('remotePreference', formData.remotePreference);
      payload.append('cv', resumeFile);

      console.log('📤 Submitting application...');

      const response = await guestAPI.submitApplication(payload);
      const { trackingToken, trackingUrl, userId } = response.data;

      console.log('✅ Submission successful:', { trackingToken, userId, trackingUrl });

      // ✅ CRITICAL: Store tracking token and enable guest mode
      addTrackingToken(trackingToken, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        jobTitle: formData.jobTitles.split(',')[0]?.trim() || 'Job Seeker',
        company: 'Multiple',
        submittedAt: new Date().toISOString()
      });
      
      enableGuestMode();

      // Show success message
      setSuccess(
        '🎉 Application submitted successfully! Redirecting to your dashboard...'
      );

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('❌ Submission error:', err);
      console.error('Error response:', err.response?.data);
      
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to submit application. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Apply as a Guest</h2>
        <p className="text-gray-600 mt-2">No account needed - get started in 2 minutes</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <div className="flex-shrink-0 text-red-600">⚠️</div>
          <p className="text-red-800 flex-1">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="flex-shrink-0 text-green-600 w-5 h-5 mt-0.5" />
          <p className="text-green-800 flex-1">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="John"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="john.doe@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="San Francisco, CA"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Job Titles
          </label>
          <input
            type="text"
            name="jobTitles"
            value={formData.jobTitles}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Software Engineer, Full Stack Developer"
          />
          <p className="mt-1 text-xs text-gray-500">Separate multiple titles with commas</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remote Preference
          </label>
          <select
            name="remotePreference"
            value={formData.remotePreference}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="any">Any</option>
            <option value="remote">Remote Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload CV <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            PDF or Word document, max 5MB
          </p>
          {resumeFile && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">
                {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)}KB)
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin w-5 h-5" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>Submit Application</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            <strong>What happens next:</strong> After submitting, you'll see your personalized 
            dashboard with real-time job matching. We'll also send you a tracking link via email 
            (check your spam folder).
          </span>
        </p>
      </div>
    </div>
  );
};

export default GuestApplicationForm;