function EmptyJobPanel({ activeCV, cvText }) {
  // Extract key information from CV text
  const extractCVSummary = (text) => {
    if (!text) return null;

    const lines = text.split("\n").filter((line) => line.trim());
    const summary = {
      name: null,
      email: null,
      phone: null,
      skills: [],
      experience: [],
    };

    // Simple parsing - extract first few lines for contact info
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();
      if (line.includes("email") || line.includes("@")) {
        summary.email = lines[i];
      } else if (line.includes("phone") || line.match(/\d{3}-\d{3}-\d{4}/)) {
        summary.phone = lines[i];
      }
    }

    // Look for skills section
    const skillsIndex = lines.findIndex((line) =>
      line.toLowerCase().includes("skill"),
    );
    if (skillsIndex !== -1) {
      for (
        let i = skillsIndex + 1;
        i < Math.min(skillsIndex + 5, lines.length);
        i++
      ) {
        if (
          !lines[i].toLowerCase().includes("experience") &&
          !lines[i].toLowerCase().includes("education")
        ) {
          const skill = lines[i].trim();
          if (skill && skill.length > 0) {
            summary.skills.push(skill);
          }
        }
      }
    }

    return summary;
  };

  const cvSummary = extractCVSummary(cvText);

  return (
    <div className="flex flex-col h-full max-h-screen overflow-y-auto">
      {/* HEADER */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="font-bold text-lg text-gray-800">AI Career Assistant</h2>
        <p className="text-sm text-gray-600 mt-1">
          Select a job to start analyzing
        </p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        {/* EMPTY STATE ICON */}
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* EMPTY STATE TEXT */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            No Job Selected
          </h3>
          <p className="text-sm text-gray-600">
            Choose a job from the list to start chatting with the AI assistant
            and get personalized insights.
          </p>
        </div>

        {/* CV SUMMARY */}
        {activeCV && (
          <div className="w-full bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold mr-2">
                ✓
              </span>
              CV Information
            </h3>

            {/* CV FILE NAME */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Active CV
              </p>
              <p className="text-sm text-gray-800 font-medium">
                {activeCV.file_name || "CV Document"}
              </p>
            </div>

            {/* CONTACT INFO */}
            {cvSummary && (
              <>
                {cvSummary.email && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Email
                    </p>
                    <p className="text-sm text-gray-700">{cvSummary.email}</p>
                  </div>
                )}

                {cvSummary.phone && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Phone
                    </p>
                    <p className="text-sm text-gray-700">{cvSummary.phone}</p>
                  </div>
                )}

                {/* SKILLS PREVIEW */}
                {cvSummary.skills.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Key Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cvSummary.skills.slice(0, 4).map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {skill.substring(0, 20)}
                          {skill.length > 20 ? "..." : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* QUICK TIP */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex gap-2 text-xs text-gray-600 italic">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-4 flex-shrink-0 mt-0.5 text-blue-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
                <p>
                  <strong>Tip:</strong> The AI assistant will analyze how your
                  CV matches with job requirements when you select a position.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyJobPanel;
