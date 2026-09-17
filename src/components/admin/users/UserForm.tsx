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
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Alert from "@mui/material/Alert";
import { userCreateSchema, userUpdateSchema } from "@/lib/validations/user";
import { createUser, updateUser } from "@/features/users/actions";
import type { RoleOption, UserListItem } from "@/features/users/types";

interface UserFormProps {
  roles: RoleOption[];
  /** Present in edit mode. */
  user?: UserListItem;
}

type FormValues = {
  name: string;
  email: string;
  password: string;
  roleId: string;
  isActive: boolean;
};

/**
 * Create/edit user form. React Hook Form + Zod for client validation; the
 * server action re-validates and is the source of truth.
 */
export default function UserForm({ roles, user }: UserFormProps) {
  const router = useRouter();
  const isEdit = Boolean(user);
  const [formError, setFormError] = React.useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEdit ? userUpdateSchema : userCreateSchema) as Resolver<FormValues>,
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      roleId: user?.roleId ?? roles[0]?.id ?? "",
      isActive: user?.isActive ?? true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const res = isEdit ? await updateUser(user!.id, values) : await createUser(values);

    if (res.ok) {
      router.push("/admin/users");
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre"
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="email"
                  label="Email"
                  error={Boolean(errors.email)}
                  helperText={errors.email?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="password"
                  label={isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
                  autoComplete="new-password"
                  error={Boolean(errors.password)}
                  helperText={
                    errors.password?.message ??
                    (isEdit ? "Déjalo vacío para no cambiarla" : "Mínimo 8 caracteres")
                  }
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Rol"
                  error={Boolean(errors.roleId)}
                  helperText={errors.roleId?.message}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
                </TextField>
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
                  label="Usuario activo"
                />
              )}
            />
          </Grid>
        </Grid>

        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ mt: 4, justifyContent: "flex-end" }}>
          <Button href="/admin/users" color="secondary" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
