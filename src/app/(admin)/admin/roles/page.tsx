import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import PageHeader from "@/components/ui/PageHeader";
import { PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Roles" };

export default function RolesPage() {
  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Estructura RBAC básica. La gestión completa se conecta en la siguiente fase."
      />
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Permisos disponibles
          </Typography>
          <List dense>
            {PERMISSIONS.map((permission) => (
              <ListItem key={permission} disableGutters secondaryAction={<Chip label="RBAC" size="small" />}>
                <ListItemText
                  primary={permission}
                  slotProps={{ primary: { sx: { fontFamily: "var(--font-geist-mono), monospace" } } }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </>
  );
}
