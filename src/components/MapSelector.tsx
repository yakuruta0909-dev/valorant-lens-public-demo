type MapSelectorProps = {
  maps: string[];
  onChange: (value: string) => void;
  value: string;
};

export function MapSelector({ maps, onChange, value }: MapSelectorProps) {
  return (
    <label className="mb-4 block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Map</span>
      <select
        className="h-11 w-full rounded-md border border-white/10 bg-[#090b10] px-3 text-sm font-semibold text-white outline-none transition focus:border-valorant-red"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {maps.map((map) => (
          <option key={map} value={map}>
            {map}
          </option>
        ))}
      </select>
    </label>
  );
}
