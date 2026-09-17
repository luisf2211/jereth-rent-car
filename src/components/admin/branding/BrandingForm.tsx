"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { brandingSchema } from "@/lib/validations/branding";
import { updateBranding } from "@/features/branding/actions";
import type { BrandingFormData } from "@/features/branding/data";
import LogoUploader from "./LogoUploader";

type FormValues = {
  companyName: string;
  contactEmail: string;
  whatsappNumber: string;
  logoUrl: string;
  primaryColor: string;
};

/**
 * Branding editor. Updates CompanySettings via a server action; changes
 * revalidate the whole site so the header/footer/logo reflect them.
 */
export default function BrandingForm({ initial }: { initial: BrandingFormData }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(brandingSchema) as Resolver<FormValues>,
    defaultValues: initial,
  });

  const primaryColor = watch("primaryColor");

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const res = await updateBranding(values);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      return;
    }
    if (res.fieldErrors) {
      for (const [field, message] of Object.entries(res.fieldErrors)) {
        setError(field as keyof FormValues, { message });
      }
    }
    setFormError(res.message);
  };

  return (
    <>
      <Card component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="companyName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre del Rent Car"
                    error={Boolean(errors.companyName)}
                    helperText={errors.companyName?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="contactEmail"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="email"
                    label="Email de contacto"
                    error={Boolean(errors.contactEmail)}
                    helperText={errors.contactEmail?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="whatsappNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="WhatsApp"
                    placeholder="18095551234"
                    error={Boolean(errors.whatsappNumber)}
                    helperText={errors.whatsappNumber?.message ?? "Solo dígitos, formato internacional"}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="primaryColor"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Color primario (opcional)"
                    placeholder="#E6007A"
                    error={Boolean(errors.primaryColor)}
                    helperText={errors.primaryColor?.message ?? "Formato hex"}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : "transparent",
                              }}
                            />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="logoUrl"
                control={control}
                render={({ field }) => (
                  <LogoUploader
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.logoUrl?.message}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ mt: 4, justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSaved(false)}>
          Branding actualizado.
        </Alert>
      </Snackbar>
    </>
  );
}
