"use client";

import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { ImageFits } from "@/types/vehicle";
import { getFit, fitToStyle } from "@/lib/image-fit";
import { useI18n } from "@/i18n/LanguageProvider";

interface Props {
  images: string[];
  alt: string;
  /** Per-photo framing map. Keys are photo URLs. */
  imageFits?: ImageFits | null;
}

/**
 * Vehicle photo gallery.
 * - Desktop: Airbnb-style grid (1 large + up to 4 small) with a "Ver todas
 *   las fotos" button opening a full dialog.
 * - Mobile: swipeable carousel with a "n / total" indicator and the SAME
 *   "Ver todas las fotos" button, opening the same fullscreen dialog.
 * Falls back gracefully with 1–4 images.
 */
export default function VehicleGalleryPro({ images, alt, imageFits }: Props) {
  const theme = useTheme();
  const { t } = useI18n();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const pics = images.length ? images : [];
  if (pics.length === 0) return null;

  const count = pics.length;
  const go = (n: number) => setIndex((p) => (p + n + count) % count);

  /** Opens the shared fullscreen "Ver todas las fotos" dialog. */
  const openGallery = () => {
    setIndex(0);
    setDialogOpen(true);
  };

  // Shared "Ver todas las fotos" button — identical look/behaviour on both
  // desktop and mobile. Positioned by the caller via the `sx` override.
  const seeAllButton = (extraSx: object) => (
    <Button
      variant="contained"
      size="small"
      startIcon={<GridViewRoundedIcon />}
      onClick={openGallery}
      sx={{
        position: "absolute",
        bgcolor: "common.white",
        color: "text.primary",
        border: "1px solid",
        borderColor: "divider",
        "&:hover": { bgcolor: "grey.100" },
        ...extraSx,
      }}
    >
      {t("gallery.seeAll")}
    </Button>
  );

  // The fullscreen dialog is the exact same experience for desktop and mobile.
  const fullscreenDialog = (
    <Dialog fullScreen open={dialogOpen} onClose={() => setDialogOpen(false)}>
      <AppBar
        position="sticky"
        sx={{ bgcolor: "common.white", color: "text.primary", borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Toolbar>
          <IconButton edge="start" onClick={() => setDialogOpen(false)} aria-label={t("common.close")}>
            <CloseRoundedIcon />
          </IconButton>
          <Typography sx={{ ml: 1 }}>
            {t("gallery.counter", { index: index + 1, total: count })}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          position: "relative",
          flexGrow: 1,
          bgcolor: "#0A0A0A",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={pics[index]}
          src={pics[index]}
          alt={alt}
          style={{ maxWidth: "100%", maxHeight: "88vh", objectFit: "contain", display: "block" }}
        />
        {count > 1 && (
          <>
            <IconButton
              onClick={() => go(-1)}
              aria-label={t("common.prev")}
              sx={{ position: "absolute", left: 16, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "common.white" } }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              onClick={() => go(1)}
              aria-label={t("common.next")}
              sx={{ position: "absolute", right: 16, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "common.white" } }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </>
        )}
      </Box>
    </Dialog>
  );

  // ---- Mobile carousel ----
  const touchStartX = React.useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  if (!isDesktop) {
    return (
      <Box>
        <Box
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          sx={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "4 / 3", bgcolor: "grey.100" }}
        >
          <Image
            key={pics[index]}
            src={pics[index]}
            alt={alt}
            fill
            // First photo is the LCP of the detail page on mobile.
            priority={index === 0}
            sizes="100vw"
            style={{
              display: "block",
              ...fitToStyle(getFit(imageFits, pics[index])),
            }}
          />
          {count > 1 && (
            <Box
              sx={{
                position: "absolute",
                bottom: 12,
                right: 12,
                px: 1.25,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "rgba(10,10,10,0.72)",
                color: "common.white",
                fontSize: 13,
              }}
            >
              {t("gallery.counter", { index: index + 1, total: count })}
            </Box>
          )}
          {/* Same "Ver todas las fotos" action as desktop; sits bottom-left so it
              doesn't overlap the "n / total" indicator on the bottom-right.
              ~20-25% more compact on mobile: reduced height, padding, icon and
              text, while staying comfortably tappable. */}
          {seeAllButton({
            bottom: 12,
            left: 12,
            // Shrink the white container to hug the icon + text.
            minWidth: 0,
            width: "auto",
            minHeight: 0,
            py: 0.3,
            px: 0.85,
            lineHeight: 1.2,
            fontSize: "0.72rem",
            "& .MuiButton-startIcon": { ml: 0, mr: 0.4 },
            "& .MuiButton-startIcon > *:nth-of-type(1)": { fontSize: 15 },
          })}
        </Box>
        {count > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.75, mt: 1.5 }}>
            {pics.map((p, i) => (
              <Box
                key={p + i}
                component="button"
                type="button"
                aria-label={t("gallery.photoN", { n: i + 1 })}
                onClick={() => setIndex(i)}
                sx={{
                  p: 0,
                  border: "none",
                  cursor: "pointer",
                  width: i === index ? 20 : 6,
                  height: 6,
                  borderRadius: 999,
                  bgcolor: i === index ? "primary.main" : "grey.400",
                  transition: "width 200ms ease",
                }}
              />
            ))}
          </Box>
        )}
        {fullscreenDialog}
      </Box>
    );
  }

  // ---- Desktop grid ----
  const main = pics[0];
  const rest = pics.slice(1, 5);

  return (
    <>
      <Box
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: rest.length ? "2fr 1fr 1fr" : "1fr",
          gridTemplateRows: rest.length ? "1fr 1fr" : "1fr",
          gap: 1,
          borderRadius: 3,
          overflow: "hidden",
          aspectRatio: "16 / 9",
        }}
      >
        <Box sx={{ gridRow: "1 / span 2", gridColumn: "1", position: "relative", bgcolor: "grey.100" }}>
          <Image
            src={main}
            alt={alt}
            fill
            // Main photo is the LCP of the detail page on desktop.
            priority
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{
              display: "block",
              ...fitToStyle(getFit(imageFits, main)),
            }}
          />
        </Box>
        {rest.map((img, i) => (
          <Box key={img + i} sx={{ position: "relative", bgcolor: "grey.100" }}>
            <Image
              src={img}
              alt={`${alt} ${i + 2}`}
              fill
              sizes="(max-width: 900px) 50vw, 25vw"
              style={{
                display: "block",
                ...fitToStyle(getFit(imageFits, img)),
              }}
            />
          </Box>
        ))}

        {seeAllButton({ bottom: 16, right: 16 })}
      </Box>

      {fullscreenDialog}
    </>
  );
}
