"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";

interface Props {
  images: string[];
  alt: string;
}

/**
 * Photo carousel for the vehicle detail page. Big main image with prev/next
 * controls and a thumbnail strip. Falls back to a single static image when
 * there's only one photo. Client component (manages the active index).
 */
export default function VehicleGallery({ images, alt }: Props) {
  const [index, setIndex] = React.useState(0);
  const count = images.length;
  const go = (n: number) => setIndex((prev) => (prev + n + count) % count);

  return (
    <Box>
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          aspectRatio: "4 / 3",
          bgcolor: "grey.100",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[index]}
          src={images[index]}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />

        {count > 1 && (
          <>
            <IconButton
              aria-label="Anterior"
              onClick={() => go(-1)}
              sx={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "common.white" },
              }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              aria-label="Siguiente"
              onClick={() => go(1)}
              sx={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "common.white" },
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: "50%",
                transform: "translateX(-50%)",
                px: 1.25,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "rgba(10,10,10,0.7)",
                color: "common.white",
                fontSize: 12,
              }}
            >
              {index + 1} / {count}
            </Box>
          </>
        )}
      </Box>

      {count > 1 && (
        <Box sx={{ display: "flex", gap: 1, mt: 1.5, overflowX: "auto", pb: 0.5 }}>
          {images.map((img, i) => (
            <Box
              key={img + i}
              component="button"
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              sx={{
                flex: "0 0 auto",
                width: 84,
                height: 62,
                p: 0,
                border: "2px solid",
                borderColor: i === index ? "primary.main" : "transparent",
                borderRadius: 2,
                overflow: "hidden",
                cursor: "pointer",
                bgcolor: "grey.100",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
