-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "alembic_version" (
    "version_num" VARCHAR(32) NOT NULL,

    CONSTRAINT "alembic_version_pkc" PRIMARY KEY ("version_num")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" SERIAL NOT NULL,
    "tokenHash" VARCHAR NOT NULL,
    "userId" VARCHAR,
    "purpose" VARCHAR,
    "expiresAt" DOUBLE PRECISION,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_analytics" (
    "id" SERIAL NOT NULL,
    "eventId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "eventType" VARCHAR,
    "metadata" JSONB,
    "ts" DOUBLE PRECISION,

    CONSTRAINT "builder_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_edits" (
    "id" SERIAL NOT NULL,
    "editId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "versionId" VARCHAR,
    "ts" DOUBLE PRECISION,
    "actor" VARCHAR,
    "source" VARCHAR,
    "userPrompt" TEXT,
    "actionSummary" TEXT,
    "changeScope" VARCHAR,
    "targets" JSONB,

    CONSTRAINT "builder_edits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_projects" (
    "id" SERIAL NOT NULL,
    "projectId" VARCHAR NOT NULL,
    "projectName" VARCHAR,
    "status" VARCHAR,
    "initialPrompt" TEXT,
    "selectedTemplateId" VARCHAR,
    "currentVersionId" VARCHAR,
    "ownerUserId" VARCHAR,
    "visibility" VARCHAR,
    "collaborators" JSONB,
    "createdAt" DOUBLE PRECISION,
    "updatedAt" DOUBLE PRECISION,

    CONSTRAINT "builder_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_quality" (
    "id" SERIAL NOT NULL,
    "projectId" VARCHAR,
    "result" JSONB,
    "ts" DOUBLE PRECISION,

    CONSTRAINT "builder_quality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_releases" (
    "id" SERIAL NOT NULL,
    "releaseId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "channel" VARCHAR,
    "versionId" VARCHAR,
    "status" VARCHAR,
    "createdAt" DOUBLE PRECISION,

    CONSTRAINT "builder_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_templates" (
    "id" SERIAL NOT NULL,
    "templateId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "galleryIndex" INTEGER,
    "generatedAt" DOUBLE PRECISION,
    "doc" JSONB,

    CONSTRAINT "builder_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_versions" (
    "id" SERIAL NOT NULL,
    "versionId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "label" VARCHAR,
    "trigger" VARCHAR,
    "createdAt" DOUBLE PRECISION,
    "snapshotHtml" TEXT,
    "snapshotProfileHash" VARCHAR,
    "s3HtmlKey" VARCHAR,

    CONSTRAINT "builder_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "builder_working_html" (
    "id" SERIAL NOT NULL,
    "projectId" VARCHAR NOT NULL,
    "html" TEXT,
    "selectedTemplateId" VARCHAR,
    "updatedAt" DOUBLE PRECISION,

    CONSTRAINT "builder_working_html_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businessProfiles" (
    "id" SERIAL NOT NULL,
    "projectId" VARCHAR NOT NULL,
    "brand" JSONB,
    "business" JSONB,
    "location" JSONB,
    "contact" JSONB,
    "design" JSONB,
    "skipped" JSONB,
    "completeness" JSONB,
    "updatedAt" DOUBLE PRECISION,

    CONSTRAINT "businessProfiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" SERIAL NOT NULL,
    "projectId" VARCHAR NOT NULL,
    "turns" JSONB,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meta" (
    "key" VARCHAR NOT NULL,
    "value" JSONB,

    CONSTRAINT "meta_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "project_assets" (
    "id" SERIAL NOT NULL,
    "assetId" VARCHAR NOT NULL,
    "projectId" VARCHAR,
    "assetType" VARCHAR,
    "filename" VARCHAR,
    "contentType" VARCHAR,
    "s3Key" VARCHAR,
    "status" VARCHAR,
    "sizeBytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedAt" DOUBLE PRECISION,
    "createdAt" DOUBLE PRECISION,
    "updatedAt" DOUBLE PRECISION,

    CONSTRAINT "project_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "userId" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "name" VARCHAR,
    "passwordHash" VARCHAR,
    "passwordSalt" VARCHAR,
    "emailVerified" BOOLEAN,
    "createdAt" DOUBLE PRECISION,
    "phone" VARCHAR,
    "country" VARCHAR,
    "category" VARCHAR,
    "role" VARCHAR,
    "disabled" BOOLEAN,
    "tokenBalance" INTEGER,
    "planId" VARCHAR,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ix_auth_tokens_tokenHash" ON "auth_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "ix_auth_tokens_userId" ON "auth_tokens"("userId");

-- CreateIndex
CREATE INDEX "ix_builder_analytics_eventId" ON "builder_analytics"("eventId");

-- CreateIndex
CREATE INDEX "ix_builder_analytics_projectId" ON "builder_analytics"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_edits_editId" ON "builder_edits"("editId");

-- CreateIndex
CREATE INDEX "ix_builder_edits_projectId" ON "builder_edits"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_builder_projects_projectId" ON "builder_projects"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_projects_ownerUserId" ON "builder_projects"("ownerUserId");

-- CreateIndex
CREATE INDEX "ix_builder_quality_projectId" ON "builder_quality"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_releases_projectId" ON "builder_releases"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_releases_releaseId" ON "builder_releases"("releaseId");

-- CreateIndex
CREATE INDEX "ix_builder_templates_projectId" ON "builder_templates"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_templates_templateId" ON "builder_templates"("templateId");

-- CreateIndex
CREATE INDEX "ix_builder_versions_projectId" ON "builder_versions"("projectId");

-- CreateIndex
CREATE INDEX "ix_builder_versions_versionId" ON "builder_versions"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_builder_working_html_projectId" ON "builder_working_html"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_businessProfiles_projectId" ON "businessProfiles"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_conversations_projectId" ON "conversations"("projectId");

-- CreateIndex
CREATE INDEX "ix_project_assets_assetId" ON "project_assets"("assetId");

-- CreateIndex
CREATE INDEX "ix_project_assets_projectId" ON "project_assets"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_users_userId" ON "users"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ix_users_email" ON "users"("email");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("userId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_analytics" ADD CONSTRAINT "builder_analytics_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_edits" ADD CONSTRAINT "builder_edits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_quality" ADD CONSTRAINT "builder_quality_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_releases" ADD CONSTRAINT "builder_releases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_templates" ADD CONSTRAINT "builder_templates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_versions" ADD CONSTRAINT "builder_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "builder_working_html" ADD CONSTRAINT "builder_working_html_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "businessProfiles" ADD CONSTRAINT "businessProfiles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_assets" ADD CONSTRAINT "project_assets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "builder_projects"("projectId") ON DELETE NO ACTION ON UPDATE NO ACTION;
