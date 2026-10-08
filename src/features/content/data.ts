import prisma from "@/lib/prisma";

/**
 * Read layer for editable public content (requirements, delivery locations,
 * FAQ, reviews). All ordered by sortOrder; only active rows for the public
 * site. Dates are returned as ISO strings so they can cross to client comps.
 */

export interface RequirementItem {
  id: string;
  /** SOURCE (Spanish) text. */
  text: string;
  /** English version (null/empty = fallback to Spanish). */
  textEn: string | null;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  /** English versions (null/empty = fallback to Spanish). */
  questionEn: string | null;
  answerEn: string | null;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  /** English comment (null/empty = fallback to Spanish). */
  commentEn: string | null;
  reviewDate: string | null;
  avatarUrl: string | null;
  source: string;
}

export async function getRequirements(): Promise<RequirementItem[]> {
  const rows = await prisma.requirement.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text, textEn: r.textEn }));
}

export interface SimpleTextItem {
  id: string;
  text: string;
  /** English version (null/empty = fallback to Spanish). */
  textEn: string | null;
}

/** "Tu renta incluye" items (public). */
export async function getInclusions(): Promise<SimpleTextItem[]> {
  const rows = await prisma.inclusion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text, textEn: r.textEn }));
}

/** Vehicle policies (public). */
export async function getPolicies(): Promise<SimpleTextItem[]> {
  const rows = await prisma.policy.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((r) => ({ id: r.id, text: r.text, textEn: r.textEn }));
}

/* ----------------------------- Admin readers ----------------------------- */
// Return ALL rows (active + inactive) for the backoffice management screens.

export interface AdminRequirement {
  id: string;
  text: string;
  textEn: string;
  sortOrder: number;
  isActive: boolean;
}
export interface AdminFaq {
  id: string;
  question: string;
  answer: string;
  questionEn: string;
  answerEn: string;
  sortOrder: number;
  isActive: boolean;
}
export interface AdminReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  commentEn: string;
  avatarUrl: string | null;
  source: string;
  /** ISO date (YYYY-MM-DD) for the date input, or empty string. */
  reviewDate: string;
  sortOrder: number;
  isActive: boolean;
}

export async function listRequirementsAdmin(): Promise<AdminRequirement[]> {
  const rows = await prisma.requirement.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    textEn: r.textEn ?? "",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

export interface AdminTextItem {
  id: string;
  text: string;
  textEn: string;
  sortOrder: number;
  isActive: boolean;
}

export async function listInclusionsAdmin(): Promise<AdminTextItem[]> {
  const rows = await prisma.inclusion.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    textEn: r.textEn ?? "",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

export async function listPoliciesAdmin(): Promise<AdminTextItem[]> {
  const rows = await prisma.policy.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({
    id: r.id,
    text: r.text,
    textEn: r.textEn ?? "",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

export async function listFaqsAdmin(): Promise<AdminFaq[]> {
  const rows = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    questionEn: f.questionEn ?? "",
    answerEn: f.answerEn ?? "",
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
    commentEn: r.commentEn ?? "",
    avatarUrl: r.avatarUrl,
    source: r.source,
    // Format as YYYY-MM-DD for the <input type="date"> in the admin.
    reviewDate: r.reviewDate ? r.reviewDate.toISOString().slice(0, 10) : "",
    sortOrder: r.sortOrder,
    isActive: r.isActive,
  }));
}

export async function getFaqs(): Promise<FaqEntry[]> {
  const rows = await prisma.faqItem.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return rows.map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    questionEn: f.questionEn,
    answerEn: f.answerEn,
  }));
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
    commentEn: r.commentEn,
    reviewDate: r.reviewDate ? r.reviewDate.toISOString() : null,
    avatarUrl: r.avatarUrl,
    source: r.source,
  }));
}
