"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { uploadVehicleImage } from "@/features/vehicles/actions";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

/**
 * Gallery uploader for a vehicle's real photos. Uploads each file to
 * Storage (vehicles/) and keeps an ordered list of public URLs. These feed
 * the detail-page carousel; the cover photo is managed separately.
 */
export default function VehicleGalleryUploader({ value, onChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setUploading(true);

    const uploaded: string[] = [];
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadVehicleImage(fd);
      if (res.ok) uploaded.push(res.url);
      else setError(res.message);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length) onChange([...value, ...uploaded]);
  };

  const removeAt = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Galería de fotos ({value.length})
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mb: 1.5 }}>
        {value.map((url, i) => (
          <Box
            key={url + i}
            sx={{
              position: "relative",
              width: 110,
              height: 82,
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <IconButton
              size="small"
              aria-label="Quitar foto"
              onClick={() => removeAt(i)}
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                bgcolor: "rgba(0,0,0,0.6)",
                color: "#fff",
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        hidden
        onChange={handleFiles}
      />
      <Button
        variant="outlined"
        color="secondary"
        startIcon={uploading ? <CircularProgress size={16} /> : <AddPhotoAlternateRoundedIcon />}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Subiendo..." : "Agregar fotos"}
      </Button>
      <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ mt: 1, display: "block" }}>
        {error ?? "Puedes subir varias. PNG, JPG, WEBP o GIF. Máx 5MB c/u."}
      </Typography>
    </Box>
  );
}
