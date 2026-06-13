type ImportExportPanelProps = {
  exportValue: string;
  importValue: string;
  onExport: () => void;
  onImport: () => void;
  onImportValueChange: (value: string) => void;
  onReset: () => void;
};

export function ImportExportPanel({
  exportValue,
  importValue,
  onExport,
  onImport,
  onImportValueChange,
  onReset,
}: ImportExportPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:border-valorant-red/60 hover:text-white"
            type="button"
            onClick={onExport}
          >
            Download Local Demo Settings
          </button>
          <button
            className="h-10 rounded-md border border-valorant-red/50 bg-valorant-red/10 px-4 text-sm font-black text-valorant-red transition hover:bg-valorant-red hover:text-white"
            type="button"
            onClick={onReset}
          >
            Reset to Defaults
          </button>
        </div>
        <textarea
          readOnly
          className="min-h-56 w-full resize-y rounded-md border border-white/10 bg-[#090b10] p-3 font-mono text-xs text-white/70 outline-none"
          value={exportValue}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            className="h-10 rounded-md border border-white/10 bg-white/[0.04] px-4 text-sm font-black text-white/75 transition hover:border-valorant-red/60 hover:text-white"
            type="button"
            onClick={onImport}
          >
            Load Local Demo Settings
          </button>
        </div>
        <textarea
          className="min-h-56 w-full resize-y rounded-md border border-white/10 bg-[#090b10] p-3 font-mono text-xs text-white outline-none transition focus:border-valorant-red"
          placeholder="Paste local demo settings JSON here"
          value={importValue}
          onChange={(event) => onImportValueChange(event.target.value)}
        />
      </div>
    </div>
  );
}
