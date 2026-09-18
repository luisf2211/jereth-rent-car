import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Rating from "@mui/material/Rating";
import Typography from "@mui/material/Typography";
import SectionTitle from "@/components/ui/SectionTitle";
import { getReviews } from "@/features/content/data";

const dateFormatter = new Intl.DateTimeFormat("es-DO", { year: "numeric", month: "long" });

/**
 * Reseñas de clientes. Renders only when there are real reviews (added from
 * the backoffice) — never seeded or invented.
 */
export default async function ReviewsSection() {
  const reviews = await getReviews();
  if (reviews.length === 0) return null;

  return (
    <Box id="resenas" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle title="Lo que dicen nuestros clientes" align="center" />
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: 1 }}>
          {reviews.map((r) => (
            <Grid key={r.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                    <Avatar src={r.avatarUrl ?? undefined}>{r.authorName.charAt(0)}</Avatar>
                    <Box>
                      <Typography variant="subtitle2">{r.authorName}</Typography>
                      {r.reviewDate && (
                        <Typography variant="caption" color="text.secondary">
                          {dateFormatter.format(new Date(r.reviewDate))}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Rating value={r.rating} readOnly size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {r.comment}
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
