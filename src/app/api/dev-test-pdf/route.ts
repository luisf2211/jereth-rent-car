import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCompanySettings } from "@/lib/branding";
import { buildConfirmationSnapshot } from "@/lib/reservations/pdf/build-snapshot";
import { renderConfirmationPdf } from "@/lib/reservations/pdf/generate";

export const dynamic = "force-dynamic";

/**
 * TEMPORARY dev-only route to render the confirmation PDF for visual review.
 * Guarded to development so it never runs in production. Remove after review.
 * Usage: GET /api/_dev/test-pdf?code=JRC-E4B  (or omit code for latest confirmed)
 */
export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  const total = await prisma.reservation.count();
  const r = code
    ? await prisma.reservation.findFirst({ where: { code }, include: { vehicle: true } })
    : await prisma.reservation.findFirst({ where: { status: "confirmed" }, orderBy: { updatedAt: "desc" }, include: { vehicle: true } });

  if (!r) return new NextResponse(`No reservation found (code=${code ?? "(latest confirmed)"}, totalRows=${total})`, { status: 404 });

  const company = await getCompanySettings();
  const snap = buildConfirmationSnapshot(
    { ...r, policyAccepted: r.policyAccepted ?? true, policyAcceptedAt: r.policyAcceptedAt ?? r.createdAt },
    r.vehicle,
    company,
    r.confirmedAt ?? new Date()
  );
  const buf = await renderConfirmationPdf(snap);

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${snap.code}.pdf"`,
    },
  });
}
