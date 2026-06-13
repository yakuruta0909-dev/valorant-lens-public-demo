import type { UserSettings } from "../types";

type CorrelationThresholds = UserSettings["correlationThresholds"];

type ThresholdEditorProps = {
  onChange: (thresholds: CorrelationThresholds) => void;
  value: CorrelationThresholds;
};

const thresholdFields: Array<{ key: keyof CorrelationThresholds; label: string }> = [
  { key: "strong", label: "High Threshold" },
  { key: "moderate", label: "Moderate Threshold" },
  { key: "weak", label: "Low Threshold" },
];

export function ThresholdEditor({ onChange, value }: ThresholdEditorProps) {
  const ordered = value.strong >= value.moderate && value.moderate >= value.weak;

  const updateThreshold = (key: keyof CorrelationThresholds, rawValue: string) => {
    const numberValue = Number(rawValue);

    onChange({
      ...value,
      [key]: Number.isFinite(numberValue) ? Math.min(Math.max(numberValue, 0), 1) : value[key],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {thresholdFields.map((field) => (
          <label key={field.key}>
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">
              {field.label}
            </span>
            <input
              className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-semibold text-white outline-none transition focus:border-valorant-red"
              max={1}
              min={0}
              step={0.01}
              type="number"
              value={value[field.key]}
              onChange={(event) => updateThreshold(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      {!ordered && (
        <div className="rounded-md border border-valorant-red/40 bg-valorant-red/10 px-4 py-3 text-sm font-bold text-valorant-red">
          Thresholds should be ordered High &gt;= Moderate &gt;= Low
        </div>
      )}
    </div>
  );
}
