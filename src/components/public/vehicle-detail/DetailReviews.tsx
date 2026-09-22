"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Avatar from "@mui/material/Avatar";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import GoogleIcon from "@mui/icons-material/Google";
import type { ReviewItem } from "@/features/content/data";

const dateFmt = new Intl.DateTimeFormat("es-DO", { year: "numeric", month: "long" });

/** Business reviews on the detail page: rating summary + first 3, "ver todas". */
export default function DetailReviews({ reviews }: { reviews: ReviewItem[] }) {
  const [showAll, setShowAll] = React.useState(false);
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const shown = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <StarRoundedIcon sx={{ color: "primary.main" }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {avg.toFixed(1)}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          · {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {shown.map((r) => (
          <Grid key={r.id} size={{ xs: 12, sm: 6 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                <Avatar src={r.avatarUrl ?? undefined}>{r.authorName.charAt(0)}</Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2">{r.authorName}</Typography>
                  {r.reviewDate && (
                    <Typography variant="caption" color="text.secondary">
                      {dateFmt.format(new Date(r.reviewDate))}
                    </Typography>
                  )}
                </Box>
                {r.source === "google" && (
                  <Chip
                    icon={<GoogleIcon sx={{ fontSize: 14 }} />}
                    label="Google"
                    size="small"
                    variant="outlined"
                    sx={{ flexShrink: 0 }}
                  />
                )}
              </Box>
              <Rating value={r.rating} readOnly size="small" sx={{ mb: 0.5 }} />
              <Typography variant="body2" color="text.secondary">
                {r.comment}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {reviews.length > 3 && (
        <Button variant="outlined" color="secondary" onClick={() => setShowAll((v) => !v)} sx={{ mt: 2.5 }}>
          {showAll ? "Mostrar menos" : `Ver todas las reseñas (${reviews.length})`}
        </Button>
      )}
    </Box>
  );
}
