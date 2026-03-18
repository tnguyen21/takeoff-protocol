import type { DecisionOption } from "@takeoff/shared";

export function RadioGroup({
  groupName,
  options,
  selected,
  onSelect,
  disabled,
}: {
  groupName: string;
  options: DecisionOption[];
  selected: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <label
            key={opt.id}
            className={`flex gap-3 items-start px-[14px] py-[10px] rounded-lg transition-all duration-[150ms] ease-in ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            style={{
              border: `1px solid ${isSelected ? "rgba(139,92,246,0.7)" : "rgba(255,255,255,0.1)"}`,
              background: isSelected ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
              opacity: disabled && !isSelected ? 0.5 : 1,
            }}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.id}
              checked={isSelected}
              disabled={disabled}
              onChange={() => !disabled && onSelect(opt.id)}
              className="mt-[3px] shrink-0"
              style={{ accentColor: "#8b5cf6" }}
            />
            <div>
              <div
                className="text-[13px] font-medium leading-[1.3]"
                style={{ color: isSelected ? "#c4b5fd" : "#e5e7eb" }}
              >
                {opt.label}
              </div>
              <div className="text-gray-400 text-xs mt-[3px] leading-[1.4]">
                {opt.description}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
