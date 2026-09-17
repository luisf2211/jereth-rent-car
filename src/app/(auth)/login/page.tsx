import * as React from "react";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Logo from "@/components/ui/Logo";
import LoginForm from "@/components/auth/LoginForm";
import { getCompanySettings } from "@/lib/branding";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage() {
  const { companyName, logoUrl } = await getCompanySettings();

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
        py: 6,
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Logo companyName={companyName} logoUrl={logoUrl} />
        </Box>
        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
              Backoffice
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ingresa con tu cuenta para administrar la plataforma.
            </Typography>
            <React.Suspense fallback={null}>
              <LoginForm />
            </React.Suspense>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
