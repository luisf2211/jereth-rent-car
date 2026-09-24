"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import VehicleCard from "@/components/public/VehicleCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Vehicle, VehicleCategory } from "@/types/vehicle";
import { CATEGORY_ORDER } from "@/features/vehicles/format";
import { useI18n } from "@/i18n/LanguageProvider";
import { categoryLabelI18n } from "@/i18n/vehicle-labels";

interface Props {
  vehicles: Vehicle[];
  whatsappNumber: string;
  digitalEnabled?: boolean;
}

type SortKey = "relevance" | "price_asc" | "price_desc";

/**
 * Public catalog with filters. Category is a chip row (fast, touch-friendly);
 * transmission / passengers / sort are selects. Everything filters client-side
 * over the already-loaded list — no extra requests, instant feedback.
 */
export default function VehiclesCatalog({ vehicles, whatsappNumber, digitalEnabled = false }: Props) {
  const { t } = useI18n();
  const [category, setCategory] = React.useState<VehicleCategory | "all">("all");
  const [transmission, setTransmission] = React.useState<"all" | "automatic" | "manual">("all");
  const [minPassengers, setMinPassengers] = React.useState<number>(0);
  const [sort, setSort] = React.useState<SortKey>("relevance");

  // Only show category chips that actually have vehicles.
  const availableCategories = React.useMemo(() => {
    const present = new Set(vehicles.map((v) => v.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [vehicles]);

  const filtered = React.useMemo(() => {
    let list = vehicles.filter((v) => {
      if (category !== "all" && v.category !== category) return false;
      if (transmission !== "all" && v.transmission !== transmission) return false;
      if (minPassengers > 0 && v.passengers < minPassengers) return false;
      return true;
    });
    if (sort === "price_asc") list = [...list].sort((a, b) => a.dailyPrice - b.dailyPrice);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.dailyPrice - a.dailyPrice);
    return list;
  }, [vehicles, category, transmission, minPassengers, sort]);

  const hasActiveFilters =
    category !== "all" || transmission !== "all" || minPassengers > 0 || sort !== "relevance";

  const reset = () => {
    setCategory("all");
    setTransmission("all");
    setMinPassengers(0);
    setSort("relevance");
  };

  return (
    <Box>
      {/* Category chips */}
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 2.5 }}>
        <Chip
          label={t("catalog.all")}
          onClick={() => setCategory("all")}
          color={category === "all" ? "primary" : "default"}
          variant={category === "all" ? "filled" : "outlined"}
        />
        {availableCategories.map((c) => (
          <Chip
            key={c}
            label={categoryLabelI18n(t, c)}
            onClick={() => setCategory(c)}
            color={category === c ? "primary" : "default"}
            variant={category === c ? "filled" : "outlined"}
          />
        ))}
      </Stack>

      {/* Selects */}
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, minmax(0, 220px)) 1fr" },
          alignItems: "center",
          mb: 3,
        }}
      >
        <TextField
          select
          size="small"
          label={t("catalog.transmission")}
          value={transmission}
          onChange={(e) => setTransmission(e.target.value as typeof transmission)}
        >
          <MenuItem value="all">{t("catalog.transmissionAll")}</MenuItem>
          <MenuItem value="automatic">{t("catalog.automatic")}</MenuItem>
          <MenuItem value="manual">{t("catalog.manual")}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t("catalog.passengers")}
          value={minPassengers}
          onChange={(e) => setMinPassengers(Number(e.target.value))}
        >
          <MenuItem value={0}>{t("catalog.passengersAny")}</MenuItem>
          <MenuItem value={2}>2+</MenuItem>
          <MenuItem value={4}>4+</MenuItem>
          <MenuItem value={5}>5+</MenuItem>
          <MenuItem value={7}>7+</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t("catalog.sort")}
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
        >
          <MenuItem value="relevance">{t("catalog.sortRelevance")}</MenuItem>
          <MenuItem value="price_asc">{t("catalog.sortPriceAsc")}</MenuItem>
          <MenuItem value="price_desc">{t("catalog.sortPriceDesc")}</MenuItem>
        </TextField>
        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, gridColumn: { xs: "1 / -1", md: "auto" } }}>
          {hasActiveFilters && (
            <Button onClick={reset} startIcon={<RestartAltRoundedIcon />} color="secondary" size="small">
              {t("catalog.clearFilters")}
            </Button>
          )}
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {filtered.length === 1
          ? t("catalog.countOne", { n: filtered.length })
          : t("catalog.countMany", { n: filtered.length })}
      </Typography>

      {filtered.length === 0 ? (
        <EmptyState
          title={t("catalog.emptyTitle")}
          description={t("catalog.emptyDescription")}
          action={
            <Button onClick={reset} variant="outlined" color="secondary">
              {t("catalog.clearFilters")}
            </Button>
          }
        />
      ) : (
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ alignItems: "stretch" }}>
          {filtered.map((vehicle) => (
            <Grid key={vehicle.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: "flex" }}>
              <VehicleCard vehicle={vehicle} whatsappNumber={whatsappNumber} digitalEnabled={digitalEnabled} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
