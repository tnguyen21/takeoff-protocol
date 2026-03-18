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
            className={`flex gap-3 items-start px-[14px] py-[10px] rounded-lg transition-all duration-[150ms] ease-in border ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            } ${isSelected ? "border-accent/70 bg-accent-bg" : "border-border bg-white/3"}`}
            style={{
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
              className="mt-[3px] shrink-0 accent-accent"
            />
            <div>
              <div
                className={`text-[13px] font-medium leading-[1.3] ${isSelected ? "text-accent-light" : "text-text-primary"}`}
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
