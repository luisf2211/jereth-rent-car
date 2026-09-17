import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

/**
 * Consistent section heading used across the landing page.
 */
export default function SectionTitle({ title, subtitle, align = "left" }: SectionTitleProps) {
  return (
    <Box sx={{ textAlign: align, maxWidth: align === "center" ? 640 : undefined, mx: align === "center" ? "auto" : undefined }}>
      <Typography variant="h4" component="h2" sx={{ mb: subtitle ? 1 : 0 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
