"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { useI18n } from "@/i18n/LanguageProvider";

/**
 * "Save my reservation link" actions for the customer tracking portal.
 * - Copy: copies the current tracking URL to the clipboard.
 * - Share: uses the native Web Share API when available (mobile), otherwise
 *   falls back to copying.
 */
export default function ReservationShareActions({ code }: { code: string }) {
  const { t } = useI18n();
  const [snack, setSnack] = React.useState<string | null>(null);
  const [canShare, setCanShare] = React.useState(false);

  // navigator.share is only known on the client; detect after mount.
  React.useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const currentUrl = () => (typeof window !== "undefined" ? window.location.href.split("?")[0] : "");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl());
      setSnack(t("share.copied"));
    } catch {
      setSnack(t("share.copyFailed"));
    }
  };

  const share = async () => {
    const url = currentUrl();
    try {
      await navigator.share({
        title: t("share.shareTitle", { code }),
        text: t("share.shareText", { code }),
        url,
      });
    } catch {
      // User cancelled or share failed — fall back to copy.
      copy();
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
            {t("share.title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("share.subtitle")}
          </Typography>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button variant="contained" startIcon={<ContentCopyRoundedIcon />} onClick={copy}>
              {t("share.copy")}
            </Button>
            {canShare && (
              <Button variant="outlined" color="secondary" startIcon={<IosShareRoundedIcon />} onClick={share}>
                {t("share.share")}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSnack(null)}>
          {snack}
        </Alert>
      </Snackbar>
    </>
  );
}
