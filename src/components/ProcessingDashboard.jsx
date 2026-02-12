// src/components/ProcessingDashboard.jsx - REAL-TIME PROGRESS UI

import React from 'react';
import { CheckCircle, Circle, Loader, Sparkles } from 'lucide-react';

const ProcessingStep = ({ title, description, complete, active }) => {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex-shrink-0 mt-1">
        {complete ? (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        ) : active ? (
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <Loader className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Circle className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${complete ? 'text-green-700' : active ? 'text-indigo-700' : 'text-gray-500'}`}>
          {title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {active && !complete && (
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProcessingDashboard = ({ status, skillsFound, matchesFound }) => {
  const steps = [
    {
      key: 'parsing',
      title: '📄 Analyzing your CV',
      description: skillsFound 
        ? `Found ${skillsFound.length} skills: ${skillsFound.slice(0, 3).join(', ')}${skillsFound.length > 3 ? '...' : ''}`
        : 'Extracting skills, experience, and qualifications',
      complete: status.cvParsed,
    },
    {
      key: 'profile',
      title: '👤 Creating your profile',
      description: status.profileCreated 
        ? 'Your job search profile is ready!'
        : 'Building your personalized job preferences',
      complete: status.profileCreated,
    },
    {
      key: 'matching',
      title: '🎯 Finding matching jobs',
      description: matchesFound > 0
        ? `Found ${matchesFound} jobs that match your profile!`
        : 'AI is analyzing 1000+ job listings to find your perfect match',
      complete: status.matchingComplete,
    }
  ];

  // Determine which step is currently active
  const activeStepIndex = steps.findIndex(step => !step.complete);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🚀 Setting up your job search...
          </h1>
          <p className="text-gray-600">
            Sit tight! We're finding the best jobs for you.
          </p>
        </div>

        {/* Progress Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          {steps.map((step, index) => (
            <ProcessingStep
              key={step.key}
              title={step.title}
              description={step.description}
              complete={step.complete}
              active={index === activeStepIndex}
            />
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Processing Time</h4>
                <p className="text-sm text-blue-700">
                  Usually takes 30-60 seconds. Feel free to grab a coffee! ☕
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-semibold text-green-900 mb-1">Privacy First</h4>
                <p className="text-sm text-green-700">
                  Your data is encrypted and will never be shared without permission.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips While Waiting */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-3">💡 While you wait...</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>We're comparing your skills against 1000+ active job listings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>AI is calculating match scores based on experience, skills, and preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              <span>You'll be able to review and approve jobs before we apply on your behalf</span>
            </li>
          </ul>
        </div>

        {/* Auto-refresh indicator */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Auto-refreshing every 5 seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProcessingDashboard;