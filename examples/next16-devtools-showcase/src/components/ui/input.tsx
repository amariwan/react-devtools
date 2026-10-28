export function Input({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        width: "100%",
        border: "1px solid #e4e4e7",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 14,
        boxSizing: "border-box",
      }}
    />
  );
}
