"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

/** Description with a "Mostrar más" toggle when the text is long. */
export default function VehicleDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const isLong = text.length > 320;

  return (
    <Box>
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          lineHeight: 1.75,
          whiteSpace: "pre-line",
          ...(isLong && !expanded
            ? { display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }
            : {}),
        }}
      >
        {text}
      </Typography>
      {isLong && (
        <Button variant="text" onClick={() => setExpanded((v) => !v)} sx={{ px: 0, mt: 0.5 }}>
          {expanded ? "Mostrar menos" : "Mostrar más"}
        </Button>
      )}
    </Box>
  );
}
