-- CreateTable
CREATE TABLE "FolderTeamAccess" (
    "id" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "accessLevel" "AccessLevel" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FolderTeamAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FolderTeamAccess_folderId_teamId_key" ON "FolderTeamAccess"("folderId", "teamId");

-- AddForeignKey
ALTER TABLE "FolderTeamAccess" ADD CONSTRAINT "FolderTeamAccess_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FolderTeamAccess" ADD CONSTRAINT "FolderTeamAccess_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
