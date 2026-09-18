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
  footerLogoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  googleMapsUrl: string;
  address: string;
  aboutText: string;
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryColor: string;
  logoScale: number;
  navLogoScale: number;
};

/** Section heading used to group related branding fields. */
function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Branding editor. Updates CompanySettings via a server action; changes
 * revalidate the whole site so the header/footer/logo reflect them.
 * Fields are grouped into cards by concern (identity, logos, contact, etc.).
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

  const renderScale = (
    name: "navLogoScale" | "logoScale",
    label: string
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {label}: {Math.round((field.value ?? 1) * 100)}%
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
  );

  return (
    <>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}

        <Stack spacing={3}>
        {/* Identidad */}
        <Card>
          <CardContent>
            <SectionHeading
              title="Identidad"
              hint="Nombre y color de la marca. El nombre se usa como texto cuando no hay logo."
            />
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
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
            </Grid>
          </CardContent>
        </Card>

        {/* Hero (portada) */}
        <Card>
          <CardContent>
            <SectionHeading
              title="Portada (hero)"
              hint="Foto de fondo y mensaje de la portada del sitio. Si dejas la imagen vacía, se usa un fondo limpio; si dejas el texto vacío, se usa el mensaje por defecto."
            />
            <Grid container spacing={3} sx={{ mt: 0.5, alignItems: "flex-start" }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="heroImageUrl"
                  control={control}
                  render={({ field }) => (
                    <LogoUploader
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.heroImageUrl?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="heroTitle"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Título de la portada (opcional)"
                          placeholder="Renta tu vehículo en Santo Domingo"
                          error={Boolean(errors.heroTitle)}
                          helperText={errors.heroTitle?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Controller
                      name="heroSubtitle"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Subtítulo de la portada (opcional)"
                          placeholder="Entrega en el Aeropuerto Las Américas (SDQ) y en toda la ciudad."
                          multiline
                          minRows={3}
                          error={Boolean(errors.heroSubtitle)}
                          helperText={errors.heroSubtitle?.message}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Logo del navbar */}
        <Card>
          <CardContent>
            <SectionHeading
              title="Logo del navbar"
              hint="Se muestra en la barra superior del sitio (fondo oscuro). Si no subes uno, se usa el nombre de la empresa en texto."
            />
            <Grid container spacing={3} sx={{ mt: 0.5, alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 6 }}>
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
              <Grid size={{ xs: 12, sm: 6 }}>
                {renderScale("navLogoScale", "Tamaño en el navbar")}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Logo del footer */}
        <Card>
          <CardContent>
            <SectionHeading
              title="Logo del footer"
              hint="Logo del pie de página. Puede ser diferente al del navbar (por ejemplo una versión más grande o con eslogan). Si lo dejas vacío, se usa el logo del navbar."
            />
            <Grid container spacing={3} sx={{ mt: 0.5, alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="footerLogoUrl"
                  control={control}
                  render={({ field }) => (
                    <LogoUploader
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.footerLogoUrl?.message}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {renderScale("logoScale", "Tamaño en el footer")}
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardContent>
            <SectionHeading title="Contacto" hint="Datos con los que los clientes pueden comunicarse." />
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
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
            </Grid>
          </CardContent>
        </Card>

        {/* Redes y ubicación */}
        <Card>
          <CardContent>
            <SectionHeading title="Redes y ubicación" hint="Se muestran en el sitio solo si las completas." />
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
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
            </Grid>
          </CardContent>
        </Card>

        {/* Nosotros */}
        <Card>
          <CardContent>
            <SectionHeading title="Nosotros" hint="Texto corto que aparece en la sección Nosotros del sitio." />
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name="aboutText"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Sobre la empresa (opcional)"
                      multiline
                      minRows={3}
                      error={Boolean(errors.aboutText)}
                      helperText={errors.aboutText?.message ?? "Texto corto para la sección Nosotros"}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={isSubmitting || !canEdit}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Stack>
        </Stack>
      </Box>

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
