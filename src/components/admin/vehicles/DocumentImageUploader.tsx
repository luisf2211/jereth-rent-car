"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { uploadVehicleImage } from "@/features/vehicles/actions";

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

/**
 * Uploads the vehicle's DEDICATED "documents" image (reservation confirmation
 * / PDF). Reuses the existing uploadVehicleImage action + Storage (vehicles/).
 * Unlike the catalog uploader, the preview shows the image COMPLETE (contain,
 * never cropped) on a checkerboard so transparency (PNG/WebP) is visible. It
 * does NOT touch the vehicle's catalog photos.
 */
export default function DocumentImageUploader({ value, onChange, error }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadVehicleImage(fd);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (res.ok) onChange(res.url);
    else setLocalError(res.message);
  };

  const shownError = error ?? localError;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        {/* Complete (contain) preview on a transparency checkerboard */}
        <Box
          sx={{
            width: 160,
            height: 120,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: shownError ? "error.main" : "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            // checkerboard so PNG/WebP transparency is visible
            backgroundImage:
              "linear-gradient(45deg,#e9e9ec 25%,transparent 25%),linear-gradient(-45deg,#e9e9ec 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e9e9ec 75%),linear-gradient(-45deg,transparent 75%,#e9e9ec 75%)",
            backgroundSize: "16px 16px",
            backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
            bgcolor: "#fff",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Imagen para documentos" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          ) : (
            <Typography variant="caption" color="text.secondary">Sin imagen</Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg,image/gif"
            hidden
            onChange={handleFile}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadRoundedIcon />}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Subiendo..." : value ? "Cambiar imagen" : "Subir imagen"}
            </Button>
            {value && !uploading && (
              <IconButton aria-label="Quitar imagen" onClick={() => onChange("")}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color={shownError ? "error" : "text.secondary"}>
            {shownError ?? "PNG o WebP con transparencia (también JPG). Se muestra completa, sin recortar. Máx 5MB. Si la dejas vacía, se usa la foto de portada."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
