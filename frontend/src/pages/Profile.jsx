import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDashboard } from "../hooks/useAuth";

function Profile() {
  const { dashboard, dashboardLoading, refreshDashboard } = useDashboard();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!dashboard) {
      refreshDashboard();
    } else {
      // take latest CV profile (most recent history)
      const latest = dashboard.job_history?.[0];

      if (latest && latest.profile) {
        setProfile(latest.profile);
      }
    }
  }, [dashboard]);

  if (dashboardLoading || !profile) {
    return (
      <Layout>
        <div className="p-6 text-gray-500">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="bg-white p-6 rounded shadow">
          <h1 className="text-2xl font-semibold">
            {profile.name || "Unnamed User"}
          </h1>
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-gray-600">{profile.phone}</p>
          <p className="text-gray-600">{profile.location}</p>
        </div>

        {/* Skills */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Education</h2>
          {profile.education?.map((edu, i) => (
            <div key={i} className="mb-3">
              <p className="font-medium">{edu.school}</p>
              <p className="text-gray-600">
                {edu.degree} ({edu.year})
              </p>
            </div>
          ))}
        </div>

        {/* Experience */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Work Experience</h2>
          {profile.work_experience?.map((exp, i) => (
            <div key={i} className="mb-4">
              <p className="font-medium">
                {exp.role} @ {exp.company}
              </p>
              <p className="text-gray-500 text-sm">{exp.duration}</p>
              <p className="text-gray-600">{exp.description}</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">Projects</h2>
          <ul className="list-disc list-inside text-gray-700">
            {profile.projects?.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export default Profile;
