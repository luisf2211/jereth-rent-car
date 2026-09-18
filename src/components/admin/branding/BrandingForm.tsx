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
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import { brandingSchema } from "@/lib/validations/branding";
import { updateBranding } from "@/features/branding/actions";
import type { BrandingFormData } from "@/features/branding/data";
import LogoUploader from "./LogoUploader";

type FormValues = {
  companyName: string;
  contactEmail: string;
  whatsappNumber: string;
  phone: string;
  logoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  googleMapsUrl: string;
  address: string;
  aboutText: string;
  primaryColor: string;
  logoScale: number;
};

/**
 * Branding editor. Updates CompanySettings via a server action; changes
 * revalidate the whole site so the header/footer/logo reflect them.
 */
export default function BrandingForm({
  initial,
  canEdit = true,
}: {
  initial: BrandingFormData;
  canEdit?: boolean;
}) {
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
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Teléfono (opcional)"
                    placeholder="+1 809 000 0000"
                    error={Boolean(errors.phone)}
                    helperText={errors.phone?.message}
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

            <Grid size={{ xs: 12, sm: 8 }}>
              <Controller
                name="logoScale"
                control={control}
                render={({ field }) => (
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tamaño del logo en el footer: {Math.round((field.value ?? 1) * 100)}%
                    </Typography>
                    <Slider
                      value={field.value ?? 1}
                      onChange={(_, v) => field.onChange(v as number)}
                      min={0.8}
                      max={3}
                      step={0.1}
                      marks={[
                        { value: 1, label: "1x" },
                        { value: 2, label: "2x" },
                        { value: 3, label: "3x" },
                      ]}
                      valueLabelDisplay="auto"
                      valueLabelFormat={(v) => `${Math.round(v * 100)}%`}
                    />
                  </Box>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Redes y ubicación
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="instagramUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Instagram (opcional)"
                    placeholder="https://instagram.com/..."
                    error={Boolean(errors.instagramUrl)}
                    helperText={errors.instagramUrl?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="facebookUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Facebook (opcional)"
                    placeholder="https://facebook.com/..."
                    error={Boolean(errors.facebookUrl)}
                    helperText={errors.facebookUrl?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Dirección (opcional)"
                    error={Boolean(errors.address)}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="googleMapsUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Google Maps URL (opcional)"
                    placeholder="https://maps.google.com/..."
                    error={Boolean(errors.googleMapsUrl)}
                    helperText={errors.googleMapsUrl?.message ?? "Solo se muestra si la agregas"}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name="aboutText"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Sobre Jereth Rent Car (opcional)"
                    multiline
                    minRows={3}
                    error={Boolean(errors.aboutText)}
                    helperText={errors.aboutText?.message ?? "Texto corto para la sección Nosotros"}
                  />
                )}
              />
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ mt: 4, justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={isSubmitting || !canEdit}>
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
