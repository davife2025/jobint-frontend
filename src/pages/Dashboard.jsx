// src/pages/Dashboard.jsx - COMPLETE WITH GUEST MODE & POLLING

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, interviewsAPI, jobsAPI, notificationsAPI } from '../services/api';
import guestAPI from '../api/guestAPI';
import { Calendar, TrendingUp, Briefcase, AlertCircle, Sparkles } from 'lucide-react';
import ActivityFeed from '../components/activityFeeds';
import StatsCard from '../components/statsCard';
import InterviewCard from '../components/interviewCard';
import ProcessingDashboard from '../components/ProcessingDashboard';

const Dashboard = () => {
  const { user, isGuestMode, getCurrentTrackingToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Guest-specific state
  const [processingStatus, setProcessingStatus] = useState({
    cvParsed: false,
    profileCreated: false,
    matchingComplete: false
  });
  const [skillsFound, setSkillsFound] = useState([]);
  const [guestData, setGuestData] = useState(null);

  // Load dashboard data
  const loadGuestDashboard = useCallback(async () => {
    try {
      const token = getCurrentTrackingToken();
      
      if (!token) {
        console.error('No tracking token found');
        setLoading(false);
        return;
      }

      console.log('📊 Loading guest dashboard with token:', token.substring(0, 8) + '...');

      const response = await guestAPI.trackApplications(token);
      const data = response.data;

      console.log('✅ Guest data loaded:', data);

      setGuestData(data);

      // Update processing status
      const status = {
        cvParsed: data.profile?.cv_parsed || false,
        profileCreated: data.profile?.profile_completed || false,
        matchingComplete: (data.pendingMatches?.length > 0) || false
      };
      
      setProcessingStatus(status);

      // Extract skills if available
      if (data.profile?.skills) {
        try {
          const skills = typeof data.profile.skills === 'string' 
            ? JSON.parse(data.profile.skills) 
            : data.profile.skills;
          setSkillsFound(Array.isArray(skills) ? skills : []);
        } catch (e) {
          console.error('Failed to parse skills:', e);
          setSkillsFound([]);
        }
      }

      // Update dashboard data
      setPendingMatches(data.pendingMatches || []);
      setRecentApplications(data.applications || []);
      setInterviews(data.interviews || []);
      setStats(data.stats || {
        total_applications: 0,
        interviews_scheduled: 0,
        offers_received: 0,
        pending_matches: 0
      });

      setLoading(false);
    } catch (error) {
      console.error('❌ Failed to load guest dashboard:', error);
      setLoading(false);
    }
  }, [getCurrentTrackingToken]);

  const loadAuthenticatedDashboard = useCallback(async () => {
    try {
      setLoading(true);
      
      const [statsRes, interviewsRes, matchesRes, appsRes, notifsRes] = await Promise.all([
        applicationsAPI.getStats().catch(() => ({ data: { summary: {} } })),
        interviewsAPI.getInterviews().catch(() => ({ data: { interviews: [] } })),
        jobsAPI.getPendingMatches().catch(() => ({ data: { matches: [] } })),
        applicationsAPI.getApplications({ limit: 10 }).catch(() => ({ data: { applications: [] } })),
        notificationsAPI.getNotifications(true).catch(() => ({ data: { notifications: [] } }))
      ]);

      setStats(statsRes.data.summary || {});
      setInterviews(interviewsRes.data.interviews?.filter(i => 
        new Date(i.scheduled_at) > new Date()
      ).slice(0, 3) || []);
      setPendingMatches(matchesRes.data.matches?.slice(0, 5) || []);
      setRecentApplications(appsRes.data.applications || appsRes.data.items || []);
      setNotifications(notifsRes.data.notifications?.slice(0, 5) || []);

      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setStats({});
      setInterviews([]);
      setPendingMatches([]);
      setRecentApplications([]);
      setNotifications([]);
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isGuestMode) {
      loadGuestDashboard();
    } else {
      loadAuthenticatedDashboard();
    }
  }, [isGuestMode, loadGuestDashboard, loadAuthenticatedDashboard]);

  // Polling for guest mode
  useEffect(() => {
    if (!isGuestMode) return;

    // Only poll if processing is not complete
    if (!processingStatus.matchingComplete) {
      console.log('🔄 Starting polling (every 5 seconds)...');
      const interval = setInterval(() => {
        loadGuestDashboard();
      }, 5000); // Poll every 5 seconds

      return () => {
        console.log('⏹️ Stopping polling');
        clearInterval(interval);
      };
    }
  }, [isGuestMode, processingStatus.matchingComplete, loadGuestDashboard]);

  const handleReviewMatch = async (matchId, approved) => {
    try {
      if (isGuestMode) {
        const token = getCurrentTrackingToken();
        await guestAPI.reviewMatch(token, matchId, approved);
      } else {
        await jobsAPI.reviewMatch(matchId, { approved });
      }

      setPendingMatches(prev => prev.filter(m => m.id !== matchId));
      
      if (approved) {
        alert('✅ Match approved! Application will be submitted automatically.');
      }
      
      // Reload data
      if (isGuestMode) {
        loadGuestDashboard();
      } else {
        loadAuthenticatedDashboard();
      }
    } catch (error) {
      console.error('Failed to review match:', error);
      alert('❌ Failed to review match. Please try again.');
    }
  };

  // Show processing UI for guests while CV is being processed
  if (isGuestMode && !processingStatus.matchingComplete && !loading) {
    return (
      <ProcessingDashboard 
        status={processingStatus}
        skillsFound={skillsFound}
        matchesFound={pendingMatches.length}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const firstName = isGuestMode 
    ? (guestData?.user?.firstName || guestData?.user?.first_name || 'there')
    : (user?.first_name || user?.firstName || 'there');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                Welcome back, {firstName}!
                {isGuestMode && <span className="text-lg">👋</span>}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {isGuestMode 
                  ? "Here's your personalized job search dashboard"
                  : "Here's what's happening with your job search"
                }
              </p>
            </div>
            {isGuestMode && processingStatus.matchingComplete && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {pendingMatches.length} jobs matched!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Applications"
            value={stats?.total_applications || stats?.total || 0}
            icon={Briefcase}
            color="indigo"
            change={`+${stats?.applied || 0} this week`}
          />
          <StatsCard
            title="Pending Matches"
            value={pendingMatches.length}
            icon={Sparkles}
            color="purple"
            change={pendingMatches.length > 0 ? 'Review now!' : 'Searching...'}
          />
          <StatsCard
            title="Interviews"
            value={interviews.length}
            icon={Calendar}
            color="green"
            change={interviews.length > 0 ? `Next: ${new Date(interviews[0]?.scheduled_at).toLocaleDateString()}` : 'None scheduled'}
          />
          <StatsCard
            title="Success Rate"
            value={`${Math.round(((stats?.interview_scheduled || 0) / Math.max(stats?.total || 1, 1)) * 100)}%`}
            icon={TrendingUp}
            color="blue"
            change="Keep going!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Pending Job Matches */}
            {pendingMatches.length > 0 && (
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                      Job Matches for You
                    </h2>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {pendingMatches.length} matches
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {pendingMatches.map((match) => (
                    <div key={match.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900">
                            {match.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{match.company}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {match.match_score}% match
                            </span>
                            {match.location && (
                              <span className="text-xs text-gray-500">
                                📍 {match.location}
                              </span>
                            )}
                            {match.remote_type && (
                              <span className="text-xs text-gray-500">
                                💼 {match.remote_type}
                              </span>
                            )}
                          </div>
                          {match.match_reasons && (
                            <div className="mt-2 text-xs text-gray-600">
                              {Array.isArray(match.match_reasons) 
                                ? match.match_reasons.slice(0, 2).map((reason, idx) => (
                                    <div key={idx} className="flex items-start gap-1 mt-1">
                                      <span className="text-green-600">✓</span>
                                      <span>{reason.description || reason}</span>
                                    </div>
                                  ))
                                : null
                              }
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={() => handleReviewMatch(match.id, true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => handleReviewMatch(match.id, false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              </div>
              <ActivityFeed applications={recentApplications} interviews={interviews} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Interviews */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Upcoming Interviews
                </h2>
              </div>
              <div className="p-6">
                {interviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">No upcoming interviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview) => (
                      <InterviewCard key={interview.id} interview={interview} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Guest Mode Tips */}
            {isGuestMode && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Success</h3>
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>• Review job matches carefully before applying</li>
                  <li>• Create an account to unlock auto-apply features</li>
                  <li>• Check your email for application updates</li>
                </ul>
              </div>
            )}

            {/* Notifications */}
            {!isGuestMode && notifications.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="px-6 py-3">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;