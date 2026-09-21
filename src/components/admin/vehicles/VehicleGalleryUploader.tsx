"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import { uploadVehicleImage } from "@/features/vehicles/actions";
import type { ImageFit, ImageFits } from "@/types/vehicle";
import { DEFAULT_FIT } from "@/lib/image-fit";
import ImageCropEditor from "./ImageCropEditor";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  /** Current framing map: keyed by photo URL. */
  fits: ImageFits;
  /** Called when framing for a single photo changes. */
  onFitChange: (url: string, fit: ImageFit) => void;
}

/**
 * Gallery uploader for a vehicle's real photos. Uploads each file to
 * Storage (vehicles/) and keeps an ordered list of public URLs. Each
 * thumbnail exposes an inline ImageCropEditor so framing can be adjusted
 * per photo without modifying the original file.
 */
export default function VehicleGalleryUploader({ value, onChange, fits, onFitChange }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Track which photo has the crop editor open (by index).
  const [openCropIdx, setOpenCropIdx] = React.useState<number | null>(null);

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
    if (uploaded.length) {
      const newUrls = [...value, ...uploaded];
      onChange(newUrls);
      // Auto-open crop editor for the first newly uploaded photo.
      setOpenCropIdx(newUrls.length - uploaded.length);
    }
  };

  const removeAt = (i: number) => {
    if (openCropIdx === i) setOpenCropIdx(null);
    else if (openCropIdx !== null && openCropIdx > i) setOpenCropIdx(openCropIdx - 1);
    onChange(value.filter((_, idx) => idx !== i));
  };

  const toggleCrop = (i: number) =>
    setOpenCropIdx((prev) => (prev === i ? null : i));

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Galería de fotos ({value.length})
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 1.5 }}>
        {value.map((url, i) => {
          const fit = fits[url] ?? DEFAULT_FIT;
          const isOpen = openCropIdx === i;
          return (
            <Box
              key={url + i}
              sx={{
                border: "1px solid",
                borderColor: isOpen ? "primary.main" : "divider",
                borderRadius: 2,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Thumbnail row */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
                <Box
                  sx={{
                    position: "relative",
                    width: 110,
                    height: 82,
                    borderRadius: 1.5,
                    overflow: "hidden",
                    flexShrink: 0,
                    bgcolor: "grey.100",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    Foto {i + 1}
                  </Typography>
                  {fit.zoom !== 1 || fit.x !== 50 || fit.y !== 50 ? (
                    <Typography variant="caption" color="primary.main" sx={{ display: "block" }}>
                      Encuadre personalizado
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
                      Sin encuadre
                    </Typography>
                  )}
                </Box>

                <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    aria-label={isOpen ? "Cerrar encuadre" : "Ajustar encuadre"}
                    onClick={() => toggleCrop(i)}
                    color={isOpen ? "primary" : "default"}
                  >
                    <TuneRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label="Quitar foto"
                    onClick={() => removeAt(i)}
                    sx={{ color: "text.secondary" }}
                  >
                    <CloseRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Inline crop editor */}
              <Collapse in={isOpen}>
                <Box sx={{ px: 2, pb: 2 }}>
                  <ImageCropEditor
                    src={url}
                    value={fit}
                    onChange={(newFit) => onFitChange(url, newFit)}
                    previewAspectRatio="4 / 3"
                    label="Encuadre para la galería del vehículo (4:3 móvil, 16:9 escritorio)"
                  />
                </Box>
              </Collapse>
            </Box>
          );
        })}
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
