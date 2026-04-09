import Layout from "../../components/layout/Layout";
import { useAdminUsage } from "../../hooks/admin/useAdminUsage";

function AdminUsage() {
  const { usage, loading, error, sortBy, setSortBy } = useAdminUsage();

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
          <h1 className="text-4xl font-bold text-gray-900">System Usage</h1>
          <p className="text-gray-600 mt-1">
            API usage and application statistics
          </p>
        </div>

        {usage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* APPLICATION USAGE */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Application Usage
              </h2>

              <div className="space-y-4">
                {/* Total Applications */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-600 font-medium">
                      Total Applications
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      {usage.applications?.total || 0}
                    </span>
                  </div>
                </div>

                {/* Submitted */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-600 font-medium">Submitted</span>
                    <span className="text-3xl font-bold text-green-600">
                      {usage.applications?.submitted || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${
                          usage.applications?.total > 0
                            ? ((usage.applications?.submitted || 0) /
                                usage.applications?.total) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Draft */}
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-600 font-medium">Draft</span>
                    <span className="text-3xl font-bold text-yellow-600">
                      {usage.applications?.draft || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{
                        width: `${
                          usage.applications?.total > 0
                            ? ((usage.applications?.draft || 0) /
                                usage.applications?.total) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* API USAGE */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                OpenRouter API Usage
              </h2>

              {usage.api?.error ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                  {usage.api.error}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Usage */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-gray-600 mb-1">Total Usage</p>
                    <p className="text-4xl font-bold text-orange-600">
                      ${usage.api?.total_usage?.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  {/* Daily Usage */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-gray-600 font-medium">
                        Daily Usage (Today)
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        ${usage.api?.usage_daily?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Weekly Usage */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-gray-600 font-medium">
                        Weekly Usage (7 days)
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        ${usage.api?.usage_weekly?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Usage */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-gray-600 font-medium">
                        Monthly Usage (30 days)
                      </span>
                      <span className="text-2xl font-bold text-indigo-600">
                        ${usage.api?.usage_monthly?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Account Info */}
                  {(usage.api?.is_free_tier || usage.api?.expires_at) && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        {usage.api?.is_free_tier && (
                          <>
                            <strong>Free Tier Account</strong>
                            {usage.api?.expires_at && (
                              <> • Expires: {usage.api.expires_at}</>
                            )}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Rate Limit Info */}
                  {usage.api?.rate_limit_requests && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Rate Limit:</strong>{" "}
                        {usage.api.rate_limit_requests} requests per{" "}
                        {usage.api.rate_limit_interval || "10s"}
                      </p>
                    </div>
                  )}

                  {/* Credit Limit Info */}
                  {(usage.api?.limit || usage.api?.limit_remaining) && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-700 space-y-1">
                        {usage.api?.limit ? (
                          <div>
                            <strong>Credit Limit:</strong> $
                            {usage.api.limit.toFixed(2)}
                          </div>
                        ) : null}
                        {usage.api?.limit_remaining !== null &&
                        usage.api?.limit_remaining !== undefined ? (
                          <div>
                            <strong>Credits Remaining:</strong> $
                            {usage.api.limit_remaining.toFixed(2)}
                          </div>
                        ) : null}
                        {usage.api?.limit_reset ? (
                          <div>
                            <strong>Limit Reset:</strong>{" "}
                            {usage.api.limit_reset}
                          </div>
                        ) : null}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* LLM FUNCTION USAGE */}
        {usage?.llm_usage && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                LLM Function Usage
              </h2>

              {/* Sorting Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy("most_used")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    sortBy === "most_used"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Most Used
                </button>
                <button
                  onClick={() => setSortBy("least_used")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    sortBy === "least_used"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Least Used
                </button>
                <button
                  onClick={() => setSortBy("most_credits")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    sortBy === "most_credits"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Most Credits
                </button>
                <button
                  onClick={() => setSortBy("least_credits")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    sortBy === "least_credits"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Least Credits
                </button>
              </div>
            </div>

            {/* LLM Functions Table */}
            {usage.llm_usage.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">
                        Function Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Count
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Total Credits
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Avg. Credits
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.llm_usage.map((func, idx) => (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {func.function_name}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">
                          {func.count}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-green-600">
                          {func.total_credits}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {func.average_credits.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No LLM function usage data yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default AdminUsage;
