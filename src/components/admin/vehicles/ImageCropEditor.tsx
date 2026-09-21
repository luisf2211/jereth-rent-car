"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ZoomInRoundedIcon from "@mui/icons-material/ZoomInRounded";
import ZoomOutRoundedIcon from "@mui/icons-material/ZoomOutRounded";
import CenterFocusStrongRoundedIcon from "@mui/icons-material/CenterFocusStrongRounded";
import type { ImageFit } from "@/types/vehicle";

interface Props {
  /** The image URL to frame. */
  src: string;
  /** Current framing value. */
  value: ImageFit;
  /** Called whenever the framing changes. */
  onChange: (fit: ImageFit) => void;
  /**
   * Aspect ratio of the preview container, expressed as "w / h" (CSS syntax).
   * Should match the ratio used on the public site for this photo slot.
   * Defaults to "4 / 3".
   */
  previewAspectRatio?: string;
  /** Optional label shown above the editor. */
  label?: string;
}

const DEFAULT_FIT: ImageFit = { x: 50, y: 50, zoom: 1 };

/**
 * Inline crop/frame editor for a vehicle photo.
 *
 * The user can:
 *   - Drag the image to pan (changes x / y focal point).
 *   - Use the zoom slider or +/− buttons to zoom in/out.
 *   - Reset to center / zoom=1 with a single button.
 *
 * No pixels are modified — only {x, y, zoom} metadata is stored and later
 * used via CSS transform on the public site.
 */
export default function ImageCropEditor({
  src,
  value,
  onChange,
  previewAspectRatio = "4 / 3",
  label,
}: Props) {
  const fit = value ?? DEFAULT_FIT;

  // ── Drag to pan ──────────────────────────────────────────────────────────
  const dragStart = React.useRef<{ mx: number; my: number; fx: number; fy: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const startDrag = (clientX: number, clientY: number) => {
    dragStart.current = { mx: clientX, my: clientY, fx: fit.x, fy: fit.y };
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!dragStart.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { mx, my, fx, fy } = dragStart.current;
    // Scale pixels → percentage of container size, then invert (dragging right
    // moves focal point left so the image shifts right).
    const dx = ((clientX - mx) / rect.width) * 100;
    const dy = ((clientY - my) / rect.height) * 100;
    const x = Math.max(0, Math.min(100, fx - dx / fit.zoom));
    const y = Math.max(0, Math.min(100, fy - dy / fit.zoom));
    onChange({ ...fit, x, y });
  };

  const endDrag = () => {
    dragStart.current = null;
  };

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  };
  const onMouseMove = (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY);
  const onMouseUp = () => endDrag();
  const onMouseLeave = () => endDrag();

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const onTouchEnd = () => endDrag();

  // ── Zoom ─────────────────────────────────────────────────────────────────
  const setZoom = (zoom: number) => onChange({ ...fit, zoom: Math.max(1, Math.min(4, zoom)) });

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => onChange(DEFAULT_FIT);

  // ── CSS for the image inside the preview ─────────────────────────────────
  // We use transform: scale + translate so the focal point (x%, y%) is
  // centred in the preview box.
  const tx = (50 - fit.x) / fit.zoom;
  const ty = (50 - fit.y) / fit.zoom;
  const imgStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${fit.x}% ${fit.y}%`,
    transform: fit.zoom !== 1 ? `scale(${fit.zoom}) translate(${tx}%, ${ty}%)` : undefined,
    transformOrigin: "center center",
    cursor: dragStart.current ? "grabbing" : "grab",
    userSelect: "none",
  };

  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
          {label}
        </Typography>
      )}

      {/* ── Preview ── */}
      <Box
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          position: "relative",
          aspectRatio: previewAspectRatio,
          overflow: "hidden",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "grey.100",
          cursor: "grab",
          "&:active": { cursor: "grabbing" },
          touchAction: "none", // prevent scroll while dragging on mobile
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" style={imgStyle} draggable={false} />

        {/* Crosshair to show focal point */}
        <Box
          sx={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.85)",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.4)",
              bgcolor: "transparent",
            }}
          />
        </Box>
      </Box>

      {/* ── Controls ── */}
      <Stack direction="row" sx={{ alignItems: "center", mt: 1, gap: 1 }}>
        <Tooltip title="Alejar">
          <span>
            <IconButton size="small" onClick={() => setZoom(fit.zoom - 0.25)} disabled={fit.zoom <= 1}>
              <ZoomOutRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Slider
          value={fit.zoom}
          min={1}
          max={4}
          step={0.05}
          onChange={(_, v) => setZoom(v as number)}
          aria-label="Zoom"
          size="small"
          sx={{ flexGrow: 1 }}
        />

        <Tooltip title="Acercar">
          <span>
            <IconButton size="small" onClick={() => setZoom(fit.zoom + 0.25)} disabled={fit.zoom >= 4}>
              <ZoomInRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title="Centrar y restablecer zoom">
          <IconButton size="small" onClick={reset} color="secondary">
            <CenterFocusStrongRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Arrastra para mover · Zoom {fit.zoom.toFixed(2)}×
      </Typography>
    </Box>
  );
}
