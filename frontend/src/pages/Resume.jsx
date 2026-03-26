import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import useResume from "../hooks/useResume";

function Resume() {
  const navigate = useNavigate();

  const { cvList, loading, deleteCV, renameCV, setPrimaryCV } = useResume();
  const [openMenu, setOpenMenu] = useState(null);

  if (loading) {
    return (
      <Layout>
        <div className="p-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Your Resumes</h2>

          <button
            onClick={() => navigate("/analyze")}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Document
          </button>
        </div>
        {cvList.length === 0 && (
          <p className="text-gray-500">No CV uploaded yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {cvList.map((cv, index) => (
            <div
              key={cv.cv_id}
              className="flex justify-between items-center bg-white p-4 rounded shadow"
            >
              <div>
                <p className="font-medium flex items-center gap-2">
                  {cv.file_name || "CV"}
                  {cv.is_primary && (
                    <span className="text-yellow-500 text-lg">★</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">CV {index + 1}</p>
              </div>

              <div className="relative">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === cv.cv_id ? null : cv.cv_id)
                  }
                  className="px-2 py-1 border rounded"
                >
                  ⋯
                </button>
                {openMenu === cv.cv_id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
                    <button
                      onClick={() =>
                        cvList.length > 1 && setPrimaryCV(cv.cv_id)
                      }
                      disabled={cvList.length <= 1}
                      className={`block w-full text-left px-4 py-2 ${
                        cvList.length <= 1
                          ? "text-gray-400 cursor-not-allowed"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      Use as Primary
                    </button>

                    <button
                      onClick={() => {
                        const newName = prompt("Enter new filename");
                        if (newName) renameCV(cv.cv_id, newName);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Rename
                    </button>

                    <button
                      onClick={() => deleteCV(cv.cv_id)}
                      className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Resume;
