-- Hybrid translation (English) fields for the remaining admin-managed dynamic
-- content, mirroring the Vehicle.descriptionEn/featuresEn pattern. All columns
-- are additive and nullable, so existing rows keep their Spanish source and the
-- public site falls back to Spanish until an English version is provided.

-- CompanySettings: about text + hero headline/subtitle (EN).
ALTER TABLE "CompanySettings" ADD COLUMN "aboutTextEn" TEXT,
ADD COLUMN "heroTitleEn" TEXT,
ADD COLUMN "heroSubtitleEn" TEXT;

-- Vehicle reviews: comment (EN). Author names are never translated.
ALTER TABLE "Review" ADD COLUMN "commentEn" TEXT;

-- Requirements to rent (EN).
ALTER TABLE "Requirement" ADD COLUMN "textEn" TEXT;

-- Delivery / pickup locations: name + description (EN).
ALTER TABLE "DeliveryLocation" ADD COLUMN "nameEn" TEXT,
ADD COLUMN "descriptionEn" TEXT;

-- "Tu renta incluye" inclusions (EN).
ALTER TABLE "Inclusion" ADD COLUMN "textEn" TEXT;

-- Vehicle rental policies (EN).
ALTER TABLE "Policy" ADD COLUMN "textEn" TEXT;

-- FAQ: question + answer (EN).
ALTER TABLE "FaqItem" ADD COLUMN "questionEn" TEXT,
ADD COLUMN "answerEn" TEXT;
