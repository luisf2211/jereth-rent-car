"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

interface Props {
  value: string[];
  onChange: (features: string[]) => void;
}

const SUGGESTIONS = [
  "Aire acondicionado",
  "Bluetooth",
  "GPS",
  "Cámara de retroceso",
  "Puerto USB",
  "Baúl amplio",
];

/**
 * Editable list of amenities. Type + Enter (or the button) to add; click the
 * chip's × to remove. Quick suggestions speed up common ones.
 */
export default function FeaturesEditor({ value, onChange }: Props) {
  const [draft, setDraft] = React.useState("");

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft("");
  };
  const remove = (f: string) => onChange(value.filter((x) => x !== f));

  const remainingSuggestions = SUGGESTIONS.filter((s) => !value.includes(s));

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
        <TextField
          size="small"
          label="Facilidad"
          placeholder="Ej. Aire acondicionado"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            }
          }}
        />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<AddRoundedIcon />}
          onClick={() => add(draft)}
          sx={{ mt: 0.25 }}
        >
          Agregar
        </Button>
      </Box>

      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {value.map((f) => (
            <Chip key={f} label={f} onDelete={() => remove(f)} />
          ))}
        </Box>
      )}

      {remainingSuggestions.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
          {remainingSuggestions.map((s) => (
            <Chip
              key={s}
              label={`+ ${s}`}
              variant="outlined"
              size="small"
              onClick={() => add(s)}
              sx={{ color: "text.secondary" }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
