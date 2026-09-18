"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

interface Props {
  value: string[];
  onChange: (features: string[]) => void;
  /** Amenities already used across vehicles, offered as searchable options. */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Aire acondicionado",
  "Bluetooth",
  "GPS",
  "Cámara de retroceso",
  "Sensores de parqueo",
  "Puerto USB",
  "Apple CarPlay",
  "Android Auto",
  "Baúl amplio",
  "Asientos de cuero",
  "Transmisión automática",
  "Cristales eléctricos",
];

/**
 * Searchable amenities picker. Type to filter existing options, pick from the
 * dropdown, or add a brand-new one (freeSolo). Selected amenities show as
 * removable chips. Options combine defaults + amenities already used across
 * the fleet, so reusing existing ones is easy and consistent.
 */
export default function FeaturesEditor({ value, onChange, suggestions = [] }: Props) {
  // Merge defaults + fleet-wide suggestions, de-duplicated (case-insensitive).
  const options = React.useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of [...suggestions, ...DEFAULT_SUGGESTIONS]) {
      const key = item.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(item.trim());
    }
    return out.sort((a, b) => a.localeCompare(b, "es"));
  }, [suggestions]);

  const normalize = (list: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of list) {
      const v = item.trim();
      const key = v.toLowerCase();
      if (!v || seen.has(key)) continue;
      seen.add(key);
      out.push(v);
    }
    return out;
  };

  return (
    <Autocomplete<string, true, false, true>
      multiple
      freeSolo
      autoHighlight
      options={options}
      value={value}
      onChange={(_, next) => onChange(normalize(next))}
      filterSelectedOptions
      renderInput={(params) => (
        <TextField
          {...params}
          label="Facilidades"
          placeholder="Busca o escribe una facilidad y presiona Enter"
          helperText="Escribe para buscar entre las existentes o agrega una nueva."
        />
      )}
    />
  );
}
