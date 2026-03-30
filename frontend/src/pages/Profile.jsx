import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { useDashboard } from "../hooks/useAuth";
import { updateProfile } from "../services/api";

function Profile() {
  const { dashboard, dashboardLoading, refreshDashboard } = useDashboard();

  const [profile, setProfile] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!dashboard) {
      refreshDashboard();
    } else {
      const latest = dashboard.job_history?.[0];
      if (latest?.profile) setProfile(latest.profile);
    }
  }, [dashboard]);

  const openEdit = (section, data) => {
    setEditingSection(section);
    setFormData(data || {});
  };

  const closeEdit = () => {
    setEditingSection(null);
    setFormData({});
  };

  const handleSave = async () => {
    let updated;

    if (editingSection === "personal") {
      // merge into root
      updated = {
        ...profile,
        ...formData,
      };
    } else {
      updated = {
        ...profile,
        [editingSection]: formData,
      };
    }

    setProfile(updated);
    closeEdit();

    await updateProfile(updated);
  };

  if (dashboardLoading || !profile) {
    return (
      <Layout>
        <div className="p-6 text-gray-500">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="bg-white p-6 rounded-xl shadow relative">
          <button
            onClick={() => openEdit("personal", profile)}
            className="absolute top-4 right-4 text-gray-500 hover:text-black"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 inline-block mr-1 align-middle"
            >
              <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
            </svg>
          </button>

          <h1 className="text-3xl font-bold mb-3">
            {profile.name || "Unnamed User"}
          </h1>

          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 inline-block mr-1 align-middle"
              >
                <path
                  fillRule="evenodd"
                  d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 2.682 2.282 16.975 16.975 0 0 0 1.145.742ZM12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                  clipRule="evenodd"
                />
              </svg>
              {profile.location || "N/A"}
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 inline-block mr-1 align-middle"
              >
                <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
                <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
              </svg>
              {profile.email || "N/A"}
            </span>
            <span className="px-3 py-1 bg-gray-100 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 inline-block mr-1 align-middle"
              >
                <path
                  fillRule="evenodd"
                  d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                  clipRule="evenodd"
                />
              </svg>
              {profile.phone || "N/A"}
            </span>
          </div>
        </div>

        {/* SKILLS */}
        <Section
          title="Skills"
          onEdit={() => openEdit("skills", profile.skills)}
        >
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
        </Section>

        {/* EDUCATION */}
        <Section
          title="Education"
          onEdit={() => openEdit("education", profile.education)}
        >
          <Timeline items={profile.education} type="education" />
        </Section>

        {/* EXPERIENCE */}
        <Section
          title="Work Experience"
          onEdit={() => openEdit("work_experience", profile.work_experience)}
        >
          <Timeline items={profile.work_experience} type="work" />
        </Section>
      </div>

      {/* EDIT MODAL */}
      {editingSection && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-[600px] max-h-[80vh] overflow-y-auto space-y-4">
            <h2 className="text-xl font-semibold capitalize">
              Edit {editingSection}
            </h2>

            {/* PERSONAL */}
            {editingSection === "personal" && (
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                />
                <Input
                  label="Email"
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                />
                <Input
                  label="Phone"
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(v) => setFormData({ ...formData, location: v })}
                />
              </div>
            )}

            {/* SKILLS */}
            {editingSection === "skills" && (
              <Input
                label="Skills (comma separated)"
                value={formData?.join(", ")}
                onChange={(v) => setFormData(v.split(",").map((s) => s.trim()))}
              />
            )}

            {/* EDUCATION */}
            {editingSection === "education" && (
              <ListEditor
                items={formData}
                setItems={setFormData}
                fields={["school", "degree", "year"]}
              />
            )}

            {/* EXPERIENCE */}
            {editingSection === "work_experience" && (
              <ListEditor
                items={formData}
                setItems={setFormData}
                fields={["role", "company", "duration", "description"]}
              />
            )}

            <div className="flex justify-end gap-3">
              <button onClick={closeEdit} className="px-4 py-2 border rounded">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Profile;

/* ---------- COMPONENTS ---------- */

function Section({ title, children, onEdit }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow relative">
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 text-gray-500 hover:text-black"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-4 h-4 inline-block mr-1 align-middle"
        >
          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
        </svg>
      </button>

      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Timeline({ items = [], type }) {
  return (
    <div className="relative border-l border-gray-300 pl-8 space-y-6">
      {items?.map((item, i) => (
        <div key={i} className="relative flex items-start gap-3">
          {/* DOT */}
          <div className="absolute -left-[11px] top-2 w-4 h-4 bg-white border-2 border-gray-400 rounded-full z-10" />

          {/* CONTENT */}
          <div className="flex-1">
            {type === "education" ? (
              <>
                <p className="text-sm text-gray-400">{item.year}</p>
                <p className="font-semibold">{item.school}</p>
                <p className="text-gray-600">{item.degree}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">{item.duration}</p>
                <p className="font-semibold">
                  {item.role} @ {item.company}
                </p>
                <p className="text-gray-600">{item.description}</p>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <input
        className="w-full border p-2 rounded"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ListEditor({ items = [], setItems, fields }) {
  const updateItem = (i, key, value) => {
    const newItems = [...items];
    newItems[i][key] = value;
    setItems(newItems);
  };

  const addItem = () => {
    const empty = {};
    fields.forEach((f) => (empty[f] = ""));
    setItems([...items, empty]);
  };

  const removeItem = (i) => {
    setItems(items.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      {items?.map((item, i) => (
        <div key={i} className="border p-3 rounded space-y-2">
          {fields.map((f) => (
            <Input
              key={f}
              label={f}
              value={item[f]}
              onChange={(v) => updateItem(i, f, v)}
            />
          ))}
          <button
            onClick={() => removeItem(i)}
            className="text-red-500 text-sm"
          >
            Remove
          </button>
        </div>
      ))}

      <button onClick={addItem} className="px-3 py-1 border rounded">
        Add
      </button>
    </div>
  );
}
