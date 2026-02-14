// src/pages/Dashboard.jsx - WITH DARK MODE SUPPORT
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import guestAPI from '../api/guestAPI';
import { 
  Briefcase, Calendar, Clock, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, FileText 
} from 'lucide-react';
import StatsCard from '../components/statsCard';
import InterviewCard from '../components/interviewCard';
import ActivityFeed from '../components/activityFeeds';
import ProcessingDashboard from '../components/ProcessingDashboard';

function Dashboard() {
  const { user, isGuestMode, getTrackingToken } = useAuth();
  const [stats, setStats] = useState(null);
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [pendingMatches, setPendingMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  const loadGuestDashboard = useCallback(async () => {
    try {
      const trackingToken = getTrackingToken();
      if (!trackingToken) {
        setError('No tracking token found');
        setLoading(false);
        return;
      }

      console.log('📊 Loading guest dashboard with token:', trackingToken.substring(0, 12) + '...');
      const response = await guestAPI.trackApplications(trackingToken);
      
      console.log('✅ Guest data loaded:', response.data);
      
      setProfile(response.data.profile);
      setApplications(response.data.applications || []);
      setInterviews(response.data.interviews || []);
      setPendingMatches(response.data.pendingMatches || []);
      setStats(response.data.stats);
      setError(null);
    } catch (err) {
      console.error('❌ Failed to load guest dashboard:', err);
      
      if (err.response?.status === 404) {
        setError('Tracking token not found. Please submit a new application.');
      } else if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment.');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  }, [getTrackingToken]);

  useEffect(() => {
    if (isGuestMode) {
      loadGuestDashboard();
    } else {
      // Load authenticated user dashboard
      setLoading(false);
    }
  }, [isGuestMode, loadGuestDashboard]);

  // Polling for guest mode
  useEffect(() => {
    if (!isGuestMode || !profile) return;

    // Check if CV is still being processed
    const isProcessing = !profile?.cv_parsed || !profile?.profile_completed;
    
    if (isProcessing) {
      console.log('🔄 Starting polling (every 5 seconds)...');
      const interval = setInterval(() => {
        loadGuestDashboard();
      }, 5000);
      
      setPollingInterval(interval);
      
      return () => {
        console.log('⏹️ Stopping polling');
        clearInterval(interval);
      };
    } else {
      if (pollingInterval) {
        console.log('⏹️ Stopping polling');
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [isGuestMode, profile, loadGuestDashboard, pollingInterval]);

  // Show processing dashboard if CV is being parsed
  if (isGuestMode && profile && (!profile.cv_parsed || !profile.profile_completed)) {
    const skillsFound = profile.skills ? JSON.parse(profile.skills) : [];
    return (
      <ProcessingDashboard
        status={{
          cvParsed: profile.cv_parsed,
          profileCreated: profile.profile_completed,
          matchingComplete: pendingMatches.length > 0
        }}
        skillsFound={skillsFound}
        matchesFound={pendingMatches.length}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadGuestDashboard}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName || user?.first_name}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isGuestMode ? 'Track your applications and job matches' : 'Here\'s your job search overview'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Applications"
            value={stats?.total_applications || 0}
            icon={Briefcase}
            color="indigo"
            change={`${applications.length} active`}
          />
          <StatsCard
            title="Pending Matches"
            value={stats?.pending_matches || 0}
            icon={TrendingUp}
            color="purple"
            change="Waiting for review"
          />
          <StatsCard
            title="Interviews"
            value={stats?.interviews_scheduled || 0}
            icon={Calendar}
            color="green"
            change={`${interviews.filter(i => new Date(i.scheduled_at) >= new Date()).length} upcoming`}
          />
          <StatsCard
            title="Offers"
            value={stats?.offers_received || 0}
            icon={CheckCircle}
            color="blue"
            change="Congratulations!"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pending Matches */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Job Matches</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Review and approve jobs that match your profile</p>
              </div>
              <div className="p-6">
                {pendingMatches.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {profile?.cv_parsed 
                        ? 'No pending matches yet. We\'re working on finding the best jobs for you!' 
                        : 'Processing your CV...'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingMatches.slice(0, 3).map((match) => (
                      <div key={match.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">{match.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{match.company}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                            {match.match_score}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{match.location}</p>
                        <div className="flex gap-2">
                          <button className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                            Apply Now
                          </button>
                          <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                            Pass
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Interviews</h2>
              </div>
              <div className="p-6">
                {interviews.filter(i => new Date(i.scheduled_at) >= new Date()).length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400">No upcoming interviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews
                      .filter(i => new Date(i.scheduled_at) >= new Date())
                      .slice(0, 3)
                      .map((interview) => (
                        <InterviewCard key={interview.id} interview={interview} />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <ActivityFeed applications={applications} interviews={interviews} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;