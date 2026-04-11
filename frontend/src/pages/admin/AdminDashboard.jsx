import Layout from "../../components/layout/Layout";
import { useAdminDashboard } from "../../hooks/admin/useAdminDashboard";

function AdminDashboard() {
  const { stats, usage, loading, error } = useAdminDashboard();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 bg-gray-100 min-h-screen">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System overview and metrics</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_users || 0}
                </p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Applications */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Total Applications
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_applications || 0}
                </p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total CVs */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total CVs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_cvs || 0}
                </p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Job Alerts */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Job Alerts</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_alerts || 0}
                </p>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Notifications */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Notifications
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.total_notifications || 0}
                </p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* API USAGE SECTION */}
        {usage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Application Usage */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Application Usage
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Total Applications</span>
                  <span className="font-bold text-lg text-gray-900">
                    {usage.applications?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-gray-600">Submitted</span>
                  <span className="font-bold text-lg text-green-600">
                    {usage.applications?.submitted || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Draft</span>
                  <span className="font-bold text-lg text-yellow-600">
                    {usage.applications?.draft || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* API Credits */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Token Usage
              </h2>
              {usage.api?.error ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm">
                  {usage.api.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Total Usage</span>
                    <span className="font-mono font-bold text-orange-600">
                      {usage.api?.total_usage?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Daily Usage</span>
                    <span className="font-mono font-bold text-gray-900">
                      {usage.api?.usage_daily?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Weekly Usage</span>
                    <span className="font-mono font-bold text-gray-900">
                      {usage.api?.usage_weekly?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monthly Usage</span>
                    <span className="font-mono font-bold text-gray-900">
                      {usage.api?.usage_monthly?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  {usage.api?.is_free_tier && (
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                      Free Tier Account (expires:{" "}
                      {usage.api?.expires_at || "N/A"})
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminDashboard;
