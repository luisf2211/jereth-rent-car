"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import type { Vehicle } from "@/types/vehicle";
import VehicleCard from "@/components/public/VehicleCard";

interface Props {
  vehicles: Vehicle[];
  whatsappNumber: string;
  digitalEnabled?: boolean;
}

/** Pixels per second the track drifts left when idle. */
const SPEED = 40;

/**
 * Infinite, auto-scrolling vehicle carousel that preserves the EXACT card
 * sizing of the previous 4-column grid. Card width is computed as
 * (containerWidth - (visible-1) * gap) / visible, matching the old
 * Grid layout: 4 cards on desktop, 2 on sm, 1 on xs — same gaps
 * ({ xs: 2.5 = 20px, md: 3 = 24px }). Cards, images, text and buttons keep
 * their original dimensions; we only add horizontal motion.
 *
 * The fleet is rendered twice back to back; a requestAnimationFrame loop
 * drifts the track left and wraps by one copy's width for a seamless loop.
 * Drag with mouse/finger to move manually; hover or drag pauses the drift.
 * Client component.
 */
export default function VehiclesCarousel({ vehicles, whatsappNumber, digitalEnabled = false }: Props) {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));

  // Same visible counts + gaps as the previous grid.
  const visible = isMd ? 4 : isSm ? 2 : 1;
  const gap = isMd ? 24 : 20; // md:3 (24px), xs/sm:2.5 (20px)

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = React.useState(0);

  const offsetRef = React.useRef(0);
  const copyWidthRef = React.useRef(0);
  const rafRef = React.useRef<number | null>(null);
  const lastTsRef = React.useRef<number | null>(null);
  const pausedRef = React.useRef(false);

  // Drag state.
  const draggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartOffsetRef = React.useRef(0);
  const movedRef = React.useRef(false);

  const loopItems = React.useMemo(() => [...vehicles, ...vehicles], [vehicles]);

  // Card width == exact column width of the old grid. On mobile (single card
  // view) we shrink to ~88% so a sliver of the next card peeks, hinting the
  // carousel continues. Desktop/tablet are unchanged.
  const measure = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const w = wrap.clientWidth;
    const cw = visible === 1 ? w * 0.88 : (w - (visible - 1) * gap) / visible;
    setCardWidth(cw);
    // One copy spans all vehicles: each card is (cw + gap) wide.
    copyWidthRef.current = vehicles.length * (cw + gap);
  }, [visible, gap, vehicles.length]);

  const applyTransform = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    let o = offsetRef.current;
    const w = copyWidthRef.current || 1;
    o = ((o % w) + w) % w;
    offsetRef.current = o;
    track.style.transform = `translateX(${-o}px)`;
  }, []);

  // useLayoutEffect measures before paint, so cards never flash at an
  // unconstrained (max-content) width on first render.
  React.useLayoutEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [measure]);

  React.useEffect(() => {
    const tick = (ts: number) => {
      const last = lastTsRef.current;
      lastTsRef.current = ts;
      if (last != null && !pausedRef.current && !draggingRef.current) {
        const dt = (ts - last) / 1000;
        offsetRef.current += SPEED * dt;
        applyTransform();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [applyTransform]);

  // ---- Pointer drag ----
  // Movement (px) beyond which a press is treated as a DRAG rather than a tap.
  // Below this, the press is a normal click/tap so the WhatsApp/Reservar
  // buttons and card navigation keep working untouched.
  const DRAG_THRESHOLD = 8;

  // Start dragging on ANY press over the carousel (including on cards and
  // buttons). We never block the press here: whether it ends up being a tap
  // (click passes through) or a drag (click suppressed) is decided by how far
  // the pointer moves, in onPointerMove/onClickCapture below.
  const onPointerDown = (e: React.PointerEvent) => {
    // Only react to primary button / touch / pen, not right-click etc.
    if (e.button !== undefined && e.button !== 0) return;
    draggingRef.current = true;
    movedRef.current = false;
    dragStartXRef.current = e.clientX;
    dragStartOffsetRef.current = offsetRef.current;
    // Note: the auto-drift tick already pauses while draggingRef is true, so we
    // don't touch pausedRef here (that flag stays dedicated to hover-pause).
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartXRef.current;
    if (!movedRef.current && Math.abs(dx) > DRAG_THRESHOLD) {
      movedRef.current = true;
      // First real horizontal movement: capture the pointer so the whole
      // gesture (left AND right, past card/button edges) stays with us.
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* capture may be unavailable; dragging still works */
      }
    }
    if (movedRef.current) {
      // Free two-way movement: dragging right advances, left retreats.
      offsetRef.current = dragStartOffsetRef.current - dx;
      applyTransform();
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer may already be released */
    }
    // draggingRef is now false, so the tick resumes the infinite drift
    // automatically (subject to hover-pause on desktop). Keep movedRef true
    // briefly so onClickCapture can suppress the click that fires right after a
    // drag; then reset.
    if (movedRef.current) setTimeout(() => { movedRef.current = false; }, 0);
  };

  // A real drag (>threshold) must not trigger card navigation NOR a button
  // click. This runs in the capture phase, before the click reaches the
  // card/anchor/button, and cancels it only when the user actually dragged.
  const onClickCapture = (e: React.MouseEvent) => {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  };

  return (
    <Box
      ref={wrapRef}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
      sx={{
        overflow: "hidden",
        maxWidth: "100%",
        minWidth: 0,
        cursor: "grab",
        "&:active": { cursor: "grabbing" },
        touchAction: "pan-y",
        userSelect: "none",
      }}
    >
      <Box
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        sx={{
          display: "flex",
          gap: `${gap}px`,
          willChange: "transform",
          width: "max-content",
          // Vertical page scroll stays with the browser; horizontal swipes are
          // handled here as manual drag (set on the track too, so the touch
          // that starts on a card reliably yields horizontal control to us).
          touchAction: "pan-y",
          // Until measured, keep the track from forcing intrinsic width.
          visibility: cardWidth ? "visible" : "hidden",
        }}
      >
        {loopItems.map((vehicle, i) => (
          <Box
            key={`${vehicle.id}-${i}`}
            sx={{ flex: "0 0 auto", width: cardWidth ? `${cardWidth}px` : `${88}%`, display: "flex" }}
          >
            <VehicleCard vehicle={vehicle} whatsappNumber={whatsappNumber} digitalEnabled={digitalEnabled} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
