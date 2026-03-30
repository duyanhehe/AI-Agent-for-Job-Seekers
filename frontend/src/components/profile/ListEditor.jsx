import Input from "./Input";

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

export default ListEditor;
