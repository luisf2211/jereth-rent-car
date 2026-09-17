import * as React from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PageHeader from "@/components/ui/PageHeader";
import { countVehicles } from "@/features/vehicles/admin-data";
import { countUsers } from "@/features/users/data";

interface StatCard {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  href?: string;
}

export default async function DashboardPage() {
  const [vehicleCount, userCount] = await Promise.all([countVehicles(), countUsers()]);

  const cards: StatCard[] = [
    {
      label: "Vehículos",
      value: String(vehicleCount),
      hint: "En el catálogo",
      icon: <DirectionsCarFilledRoundedIcon />,
      href: "/admin/vehicles",
    },
    {
      label: "Usuarios",
      value: String(userCount),
      hint: "Gestiona el equipo",
      icon: <PeopleRoundedIcon />,
      href: "/admin/users",
    },
    {
      label: "Reservas",
      value: "—",
      hint: "Próximamente",
      icon: <EventAvailableRoundedIcon />,
    },
  ];

  return (
    <>
      <PageHeader title="Bienvenido" description="Resumen general de tu plataforma de renta." />
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {cards.map((card) => {
          const content = (
            <Box sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "grey.100",
                  color: "primary.main",
                  mb: 2,
                }}
              >
                {card.icon}
              </Box>
              <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
                {card.value}
              </Typography>
              <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 600 }}>
                {card.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.hint}
              </Typography>
            </Box>
          );

          return (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%" }}>
                {card.href ? (
                  <CardActionArea href={card.href} sx={{ height: "100%" }}>
                    {content}
                  </CardActionArea>
                ) : (
                  content
                )}
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
