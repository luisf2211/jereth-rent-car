"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { uploadLogo } from "@/features/branding/actions";

interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

/**
 * Uploads a logo image to Supabase Storage (branding/) via a server action
 * and reports the resulting public URL back to the form.
 */
export default function LogoUploader({ value, onChange, error }: LogoUploaderProps) {
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
    const res = await uploadLogo(fd);

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";

    if (res.ok) {
      onChange(res.url);
    } else {
      setLocalError(res.message);
    }
  };

  const shownError = error ?? localError;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Logo
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: shownError ? "error.main" : "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            overflow: "hidden",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Sin logo
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={uploading ? <CircularProgress size={16} /> : <UploadRoundedIcon />}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Subiendo..." : value ? "Cambiar logo" : "Subir logo"}
            </Button>
            {value && !uploading && (
              <IconButton aria-label="Quitar logo" onClick={() => onChange("")}>
                <DeleteOutlineRoundedIcon />
              </IconButton>
            )}
          </Box>
          <Typography variant="caption" color={shownError ? "error" : "text.secondary"}>
            {shownError ?? "PNG, JPG, WEBP o GIF. Máx 5MB."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
