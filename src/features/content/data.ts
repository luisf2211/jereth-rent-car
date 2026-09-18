import prisma from "@/lib/prisma";

/**
 * Read layer for editable public content (requirements, delivery locations,
 * FAQ, reviews). All ordered by sortOrder; only active rows for the public
 * site. Dates are returned as ISO strings so they can cross to client comps.
 */

export interface RequirementItem {
  id: string;
  text: string;
}

export interface DeliveryLocationItem {
  id: string;
  name: string;
  description: string | null;
  highlighted: boolean;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  reviewDate: string | null;
  avatarUrl: string | null;
  source: string;
}

export async function getRequirements(): Promise<RequirementItem[]> {
  const rows = await prisma.requirement.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text }));
}

export interface SimpleTextItem {
  id: string;
  text: string;
}

/** "Tu renta incluye" items (public). */
export async function getInclusions(): Promise<SimpleTextItem[]> {
  const rows = await prisma.inclusion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text }));
}

/** Vehicle policies (public). */
export async function getPolicies(): Promise<SimpleTextItem[]> {
  const rows = await prisma.policy.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text }));
}

/* ----------------------------- Admin readers ----------------------------- */
// Return ALL rows (active + inactive) for the backoffice management screens.

export interface AdminRequirement {
  id: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
}
export interface AdminDeliveryLocation {
  id: string;
  name: string;
  description: string | null;
  highlighted: boolean;
  sortOrder: number;
  isActive: boolean;
}
export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}
export interface AdminReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  avatarUrl: string | null;
  source: string;
  sortOrder: number;
  isActive: boolean;
}

export async function listRequirementsAdmin(): Promise<AdminRequirement[]> {
  const rows = await prisma.requirement.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, text: r.text, sortOrder: r.sortOrder, isActive: r.isActive }));
}

export interface AdminTextItem {
  id: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
}

export async function listInclusionsAdmin(): Promise<AdminTextItem[]> {
  const rows = await prisma.inclusion.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, text: r.text, sortOrder: r.sortOrder, isActive: r.isActive }));
}

export async function listPoliciesAdmin(): Promise<AdminTextItem[]> {
  const rows = await prisma.policy.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, text: r.text, sortOrder: r.sortOrder, isActive: r.isActive }));
}

export async function listDeliveryLocationsAdmin(): Promise<AdminDeliveryLocation[]> {
  const rows = await prisma.deliveryLocation.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    highlighted: d.highlighted,
    sortOrder: d.sortOrder,
    isActive: d.isActive,
  }));
}

export async function listFaqsAdmin(): Promise<AdminFaq[]> {
  const rows = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    sortOrder: f.sortOrder,
    isActive: f.isActive,
  }));
}

export async function listReviewsAdmin(): Promise<AdminReview[]> {
  const rows = await prisma.review.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    avatarUrl: r.avatarUrl,
    source: r.source,
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

export async function getDeliveryLocations(): Promise<DeliveryLocationItem[]> {
  const rows = await prisma.deliveryLocation.findMany({
    where: { isActive: true },
    orderBy: [{ highlighted: "desc" }, { sortOrder: "asc" }],
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    highlighted: d.highlighted,
  }));
}

export async function getFaqs(): Promise<FaqEntry[]> {
  const rows = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
}

export async function getReviews(): Promise<ReviewItem[]> {
  const rows = await prisma.review.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    reviewDate: r.reviewDate ? r.reviewDate.toISOString() : null,
    avatarUrl: r.avatarUrl,
    source: r.source,
  }));
}
