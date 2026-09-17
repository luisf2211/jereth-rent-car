import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

/**
 * Neutral placeholder for empty lists / not-yet-implemented sections.
 */
export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: 6,
        px: 3,
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        color: "text.secondary",
      }}
    >
      <Box sx={{ color: "text.disabled", mb: 1, "& svg": { fontSize: 48 } }}>
        {icon ?? <InboxRoundedIcon />}
      </Box>
      <Typography variant="h6" color="text.primary" sx={{ mb: description ? 0.5 : 0 }}>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
