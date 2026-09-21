"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { uploadVehicleImage } from "@/features/vehicles/actions";
import type { ImageFit } from "@/types/vehicle";
import { DEFAULT_FIT } from "@/lib/image-fit";
import ImageCropEditor from "./ImageCropEditor";

interface Props {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  /** Current framing for this photo. */
  fit: ImageFit;
  /** Called when the user adjusts the framing. */
  onFitChange: (fit: ImageFit) => void;
  /**
   * Aspect ratio string passed to ImageCropEditor preview (CSS syntax).
   * Should match the ratio used on the public site for this slot.
   */
  previewAspectRatio?: string;
}

/**
 * Uploads a vehicle photo to Supabase Storage (vehicles/) and exposes an
 * inline ImageCropEditor so the admin can adjust framing without touching
 * the original file.
 */
export default function VehicleImageUploader({
  value,
  onChange,
  error,
  fit,
  onFitChange,
  previewAspectRatio = "4 / 3",
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [cropOpen, setCropOpen] = React.useState(false);

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

    if (res.ok) {
      onChange(res.url);
      // Reset framing when a new photo is uploaded.
      onFitChange(DEFAULT_FIT);
      setCropOpen(true); // auto-open editor after upload
    } else {
      setLocalError(res.message);
    }
  };

  const shownError = error ?? localError;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Foto del vehículo
      </Typography>

      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
        {/* Thumbnail preview */}
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
            bgcolor: "grey.50",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Vehículo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Sin foto
            </Typography>
          )}
        </Box>

        {/* Action buttons */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
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
              {uploading ? "Subiendo..." : value ? "Cambiar foto" : "Subir foto"}
            </Button>
            {value && !uploading && (
              <>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<TuneRoundedIcon />}
                  onClick={() => setCropOpen((o) => !o)}
                >
                  {cropOpen ? "Ocultar encuadre" : "Ajustar encuadre"}
                </Button>
                <IconButton aria-label="Quitar foto" onClick={() => { onChange(""); onFitChange(DEFAULT_FIT); setCropOpen(false); }}>
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </>
            )}
          </Box>
          <Typography variant="caption" color={shownError ? "error" : "text.secondary"}>
            {shownError ?? "PNG, JPG, WEBP o GIF. Máx 5MB."}
          </Typography>
        </Box>
      </Box>

      {/* Inline crop editor */}
      <Collapse in={cropOpen && Boolean(value)}>
        <Box sx={{ mt: 2 }}>
          <ImageCropEditor
            src={value}
            value={fit}
            onChange={onFitChange}
            previewAspectRatio={previewAspectRatio}
            label="Arrastra para mover el encuadre. El recuadre se guarda con el vehículo."
          />
        </Box>
      </Collapse>
    </Box>
  );
}
