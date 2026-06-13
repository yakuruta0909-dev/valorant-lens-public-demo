import type { UserSettings } from "../types";

type PerformanceWeights = UserSettings["performanceWeights"];

type WeightEditorProps = {
  onChange: (weights: PerformanceWeights) => void;
  value: PerformanceWeights;
};

const weightFields: Array<{ key: keyof PerformanceWeights; label: string }> = [
  { key: "acs", label: "ACS Weight" },
  { key: "kd", label: "KD Weight" },
  { key: "hsRate", label: "HS Rate Weight" },
  { key: "win", label: "Win Weight" },
  { key: "difficulty", label: "Difficulty Weight" },
];

export function WeightEditor({ onChange, value }: WeightEditorProps) {
  const total = weightFields.reduce((sum, field) => sum + value[field.key], 0);
  const validTotal = Math.abs(total - 1) < 0.001;

  const updateWeight = (key: keyof PerformanceWeights, rawValue: string) => {
    const numberValue = Number(rawValue);

    onChange({
      ...value,
      [key]: Number.isFinite(numberValue) ? Math.min(Math.max(numberValue, 0), 1) : value[key],
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {weightFields.map((field) => (
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
              onChange={(event) => updateWeight(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>

      <div
        className={`rounded-md border px-4 py-3 text-sm font-bold ${
          validTotal
            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
            : "border-valorant-red/40 bg-valorant-red/10 text-valorant-red"
        }`}
      >
        Total: {total.toFixed(2)}
        {!validTotal && <span className="ml-3">Lens Score weights must total 1.00</span>}
      </div>
    </div>
  );
}
