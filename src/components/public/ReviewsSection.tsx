import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import GoogleIcon from "@mui/icons-material/Google";
import SectionTitle from "@/components/ui/SectionTitle";
import { getReviews } from "@/features/content/data";
import { getI18n } from "@/i18n/server";
import { localizeReview } from "@/i18n/content-overrides";

/**
 * Reseñas de clientes. Author names are shown as-is; the review COMMENT is
 * shown in the active language when it matches known demo content
 * (localizeReview). The section title and date formatting follow the locale.
 */
export default async function ReviewsSection() {
  const [reviews, { t, locale }] = await Promise.all([getReviews(), getI18n()]);
  if (reviews.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(t("reviews.dateLocale"), {
    year: "numeric",
    month: "long",
  });

  return (
    <Box id="resenas" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle title={t("reviews.title")} align="center" />
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: 1 }}>
          {reviews.map((r) => (
            <Grid key={r.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Avatar src={r.avatarUrl ?? undefined}>{r.authorName.charAt(0)}</Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2">{r.authorName}</Typography>
                      {r.reviewDate && (
                        <Typography variant="caption" color="text.secondary">
                          {dateFormatter.format(new Date(r.reviewDate))}
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
                  <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {localizeReview(locale, r.comment)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
