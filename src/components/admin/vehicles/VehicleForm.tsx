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
import VehicleImageUploader from "./VehicleImageUploader";

interface VehicleFormProps {
  vehicle?: VehicleAdminItem;
}

type FormValues = {
  brand: string;
  model: string;
  year: number;
  transmission: "automatic" | "manual";
  passengers: number;
  dailyPrice: number;
  imageUrl: string;
  isActive: boolean;
};

/**
 * Create/edit vehicle form. RHF + Zod for client validation; server action
 * re-validates and persists.
 */
export default function VehicleForm({ vehicle }: VehicleFormProps) {
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
      transmission: vehicle?.transmission ?? "automatic",
      passengers: vehicle?.passengers ?? 5,
      dailyPrice: vehicle?.dailyPrice ?? 35,
      imageUrl: vehicle?.imageUrl ?? "",
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
          <Grid size={{ xs: 12 }}>
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
