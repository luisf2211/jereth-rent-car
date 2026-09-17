import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/ui/PageHeader";
import { getCompanySettings } from "@/lib/branding";

export const metadata: Metadata = { title: "Branding" };

export default function BrandingSettingsPage() {
  const settings = getCompanySettings();

  const fields: { label: string; value: string }[] = [
    { label: "Nombre del Rent Car", value: settings.companyName },
    { label: "Logo", value: settings.logoUrl ?? "Usando logo por defecto (texto + ícono)" },
    { label: "WhatsApp", value: settings.whatsappNumber },
    { label: "Email de contacto", value: settings.contactEmail },
    { label: "Color primario", value: settings.primaryColor ?? "Predeterminado del tema (magenta)" },
  ];

  return (
    <>
      <PageHeader
        title="Branding"
        description="Personaliza la identidad de tu Rent Car. La edición se habilita al conectar la base de datos."
      />
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {fields.map((field) => (
              <Grid key={field.label} size={{ xs: 12, sm: 6 }}>
                <Typography variant="body2" color="text.secondary">
                  {field.label}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {field.value}
                </Typography>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Estos valores provienen de una fuente central (mock) que migrará a la tabla
              <code> CompanySettings</code> sin cambios en la interfaz.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
