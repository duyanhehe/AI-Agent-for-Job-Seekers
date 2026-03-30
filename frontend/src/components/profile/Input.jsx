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

export default Input;
