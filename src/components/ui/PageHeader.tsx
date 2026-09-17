import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions (buttons, etc.). */
  action?: React.ReactNode;
}

/**
 * Header for admin pages: title + optional description and actions.
 * Stacks vertically on mobile, splits horizontally from sm up.
 */
export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{ mb: 3, alignItems: { sm: "center" }, justifyContent: "space-between" }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Stack>
  );
}
