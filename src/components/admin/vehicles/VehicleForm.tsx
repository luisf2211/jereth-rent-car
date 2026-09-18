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
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { createVehicle, updateVehicle } from "@/features/vehicles/actions";
import type { VehicleAdminItem } from "@/features/vehicles/admin-data";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { CATEGORY_ORDER, categoryLabel } from "@/features/vehicles/format";
import VehicleImageUploader from "./VehicleImageUploader";
import VehicleGalleryUploader from "./VehicleGalleryUploader";
import FeaturesEditor from "./FeaturesEditor";

interface VehicleFormProps {
  vehicle?: VehicleAdminItem;
  /** Amenities already used across the fleet, for the searchable picker. */
  featureSuggestions?: string[];
}

type FormValues = {
  brand: string;
  model: string;
  year: number;
  category: "economico" | "compacto" | "sedan" | "suv" | "suv_grande" | "premium";
  orSimilar: boolean;
  transmission: "automatic" | "manual";
  fuelType: "gasolina" | "diesel" | "hibrido" | "electrico";
  passengers: number;
  doors: number;
  dailyPrice: number;
  imageUrl: string;
  carouselImageUrl: string;
  images: string[];
  description: string;
  features: string[];
  whatsappMessage: string;
  isActive: boolean;
};

/**
 * Create/edit vehicle form. RHF + Zod for client validation; server action
 * re-validates and persists.
 */
export default function VehicleForm({ vehicle, featureSuggestions = [] }: VehicleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vehicle);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(vehicleSchema) as Resolver<FormValues>,
    defaultValues: {
      brand: vehicle?.brand ?? "",
      model: vehicle?.model ?? "",
      year: vehicle?.year ?? new Date().getFullYear(),
      category: vehicle?.category ?? "economico",
      orSimilar: vehicle?.orSimilar ?? true,
      transmission: vehicle?.transmission ?? "automatic",
      fuelType: vehicle?.fuelType ?? "gasolina",
      passengers: vehicle?.passengers ?? 5,
      doors: vehicle?.doors ?? 4,
      dailyPrice: vehicle?.dailyPrice ?? 35,
      imageUrl: vehicle?.imageUrl ?? "",
      carouselImageUrl: vehicle?.carouselImageUrl ?? "",
      images: vehicle?.images ?? [],
      description: vehicle?.description ?? "",
      features: vehicle?.features ?? [],
      whatsappMessage: vehicle?.whatsappMessage ?? "",
      isActive: vehicle?.isActive ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const res = isEdit ? await updateVehicle(vehicle!.id, values) : await createVehicle(values);

    if (res.ok) {
      router.push("/admin/vehicles");
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
    <Card component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardContent>
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Foto de portada
            </Typography>
            <Controller
              name="imageUrl"
              control={control}
              render={({ field }) => (
                <VehicleImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.imageUrl?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Foto de carrusel (portada del inicio)
            </Typography>
            <Controller
              name="carouselImageUrl"
              control={control}
              render={({ field }) => (
                <VehicleImageUploader
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.carouselImageUrl?.message}
                />
              )}
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Se muestra en el carrusel del inicio. Si la dejas vacía, se usa la foto de portada.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="brand"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Marca" error={Boolean(errors.brand)} helperText={errors.brand?.message} />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="model"
              control={control}
              render={({ field }) => (
                <TextField {...field} label="Modelo" error={Boolean(errors.model)} helperText={errors.model?.message} />
              )}
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="year"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Año"
                  error={Boolean(errors.year)}
                  helperText={errors.year?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="passengers"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Pasajeros"
                  error={Boolean(errors.passengers)}
                  helperText={errors.passengers?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="transmission"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Transmisión"
                  error={Boolean(errors.transmission)}
                  helperText={errors.transmission?.message}
                >
                  <MenuItem value="automatic">Automático</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="fuelType"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Combustible"
                  error={Boolean(errors.fuelType)}
                  helperText={errors.fuelType?.message}
                >
                  <MenuItem value="gasolina">Gasolina</MenuItem>
                  <MenuItem value="diesel">Diésel</MenuItem>
                  <MenuItem value="hibrido">Híbrido</MenuItem>
                  <MenuItem value="electrico">Eléctrico</MenuItem>
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="doors"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Puertas"
                  error={Boolean(errors.doors)}
                  helperText={errors.doors?.message}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categoría"
                  error={Boolean(errors.category)}
                  helperText={errors.category?.message}
                >
                  {CATEGORY_ORDER.map((c) => (
                    <MenuItem key={c} value={c}>
                      {categoryLabel(c)}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="orSimilar"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  sx={{ mt: 1 }}
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label='Mostrar "o similar" en el sitio'
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Controller
              name="dailyPrice"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Precio / día"
                  error={Boolean(errors.dailyPrice)}
                  helperText={errors.dailyPrice?.message}
                  slotProps={{
                    input: { startAdornment: <InputAdornment position="start">US$</InputAdornment> },
                  }}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
              Descripción y facilidades
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descripción breve (opcional)"
                  multiline
                  minRows={3}
                  error={Boolean(errors.description)}
                  helperText={errors.description?.message ?? "Un párrafo corto sobre el vehículo"}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Controller
              name="features"
              control={control}
              render={({ field }) => (
                <FeaturesEditor
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={featureSuggestions}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="whatsappMessage"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Mensaje de WhatsApp (opcional)"
                  multiline
                  minRows={2}
                  error={Boolean(errors.whatsappMessage)}
                  helperText={
                    errors.whatsappMessage?.message ??
                    "Mensaje que se envía al consultar por este vehículo. Usa {vehicle} para insertar el nombre. Si lo dejas vacío se usa el mensaje por defecto."
                  }
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Controller
              name="images"
              control={control}
              render={({ field }) => (
                <VehicleGalleryUploader value={field.value} onChange={field.onChange} />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Publicado en el catálogo"
                />
              )}
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ mt: 4, justifyContent: "flex-end" }}>
          <Button href="/admin/vehicles" color="secondary" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear vehículo"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
