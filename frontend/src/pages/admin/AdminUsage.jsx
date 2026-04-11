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
                Gemini API Usage
              </h2>

              {usage.api?.error ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700">
                  {usage.api.error}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Total Usage */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Total Token Usage</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {usage.api?.total_usage?.toLocaleString() || "0"}
                    </p>
                  </div>

                  {/* Daily Usage */}
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-gray-600 font-medium">
                        Daily Usage (Today)
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        {usage.api?.usage_daily?.toLocaleString() || "0"}
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
                        {usage.api?.usage_weekly?.toLocaleString() || "0"}
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
                        {usage.api?.usage_monthly?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>

                  {/* Account Info */}
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Model:</strong> {usage.api?.model || "gemini-2.5-flash-lite"}
                      <br />
                      <strong>Mode:</strong> Free Tier (Rate limited)
                    </p>
                  </div>

                  {/* Token breakdown */}
                  {usage.api?.details && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="text-xs text-gray-500 space-y-1">
                        <div>Prompt Tokens: {usage.api.details.prompt_tokens_total?.toLocaleString()}</div>
                        <div>Completion Tokens: {usage.api.details.completion_tokens_total?.toLocaleString()}</div>
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
                  onClick={() => setSortBy("most_tokens")}
                  className={`px-3 py-1 rounded text-xs font-medium transition ${
                    sortBy === "most_tokens"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Most Tokens
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
                        Total Tokens
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Avg. Tokens
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">
                        Credits Spent
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
                          {func.total_tokens?.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {func.average_tokens?.toFixed(0)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">
                          {func.total_credits}
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
