import prisma from "./db";
import type { AccessLevel } from "@prisma/client";

export type EffectiveAccessLevel = "OWNER" | AccessLevel;

export interface EffectiveAccess {
  isOwner: boolean;
  accessLevel: EffectiveAccessLevel | null;
  hasAccess: boolean;
  canEdit: boolean;
  canDownload: boolean;
  // Human-readable reason access was granted — useful for UI badges.
  source: "OWNER" | "DIRECT_SHARE" | "PROJECT_OWNER" | "PROJECT_TEAM" | "PROJECT_TEAM_SHARE" | "PROJECT_SHARE" | null;
}

const folderAccessInclude = {
  team: { include: { members: true } },
  grantedAccess: true,
  teamAccess: { include: { team: { include: { members: true } } } },
} as const;

type FolderWithAccess = {
  ownerId: string;
  team: { members: { userId: string }[] } | null;
  grantedAccess: { userId: string; accessLevel: AccessLevel }[];
  teamAccess: { accessLevel: AccessLevel; team: { members: { userId: string }[] } }[];
} | null;

/**
 * Resolves a user's effective access to a project (folder), considering:
 * ownership, membership of the folder's owning team, a direct per-user
 * grant (FolderAccess), or membership of a team the project has been
 * additionally shared with (FolderTeamAccess).
 */
export function resolveFolderAccess(userId: string, folder: FolderWithAccess): EffectiveAccess {
  if (!folder) {
    return { isOwner: false, accessLevel: null, hasAccess: false, canEdit: false, canDownload: false, source: null };
  }

  const isOwner = folder.ownerId === userId;
  if (isOwner) {
    return { isOwner: true, accessLevel: "OWNER", hasAccess: true, canEdit: true, canDownload: true, source: "OWNER" };
  }

  const isOwningTeamMember = folder.team ? folder.team.members.some((m: any) => m.userId === userId) : false;
  if (isOwningTeamMember) {
    return { isOwner: false, accessLevel: "EDITOR", hasAccess: true, canEdit: true, canDownload: true, source: "PROJECT_TEAM" };
  }

  const directGrant = folder.grantedAccess.find((g: any) => g.userId === userId);
  const teamShare = folder.teamAccess.find((ta: any) => ta.team.members.some((m: any) => m.userId === userId));

  // If both a direct grant and a team share exist, take whichever is more permissive.
  const candidates: { level: AccessLevel; source: EffectiveAccess["source"] }[] = [];
  if (directGrant) candidates.push({ level: directGrant.accessLevel, source: "PROJECT_SHARE" });
  if (teamShare) candidates.push({ level: teamShare.accessLevel, source: "PROJECT_TEAM_SHARE" });

  if (candidates.length === 0) {
    return { isOwner: false, accessLevel: null, hasAccess: false, canEdit: false, canDownload: false, source: null };
  }

  const best = candidates.some((c: any) => c.level === "EDITOR")
    ? candidates.find((c: any) => c.level === "EDITOR")!
    : candidates[0];

  return {
    isOwner: false,
    accessLevel: best.level,
    hasAccess: true,
    canEdit: best.level === "EDITOR",
    canDownload: best.level === "EDITOR",
    source: best.source,
  };
}

export async function getFolderAccess(userId: string, folderId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: folderAccessInclude,
  });
  return { folder, access: resolveFolderAccess(userId, folder) };
}

type DocumentWithAccess = {
  ownerId: string;
  sharedAccess: { userId: string; accessLevel: AccessLevel; canDownload: boolean }[];
  folder: FolderWithAccess;
} | null;

/**
 * Resolves a user's effective access to a document, considering direct
 * ownership/sharing on the document itself, AND the access they have to
 * the project (folder) the document lives in — so sharing a whole project
 * with a team or a person also unlocks the files inside it.
 */
export function resolveDocumentAccess(userId: string, document: DocumentWithAccess): EffectiveAccess {
  if (!document) {
    return { isOwner: false, accessLevel: null, hasAccess: false, canEdit: false, canDownload: false, source: null };
  }

  const isOwner = document.ownerId === userId;
  if (isOwner) {
    return { isOwner: true, accessLevel: "OWNER", hasAccess: true, canEdit: true, canDownload: true, source: "OWNER" };
  }

  const directAccess = document.sharedAccess.find((a: any) => a.userId === userId);
  const folderAccess = resolveFolderAccess(userId, document.folder);

  // Being the owner of the containing project (but not the document) still
  // grants full editor rights — the project owner shouldn't be locked out
  // of files their teammates uploaded into their own project.
  if (folderAccess.isOwner) {
    return { isOwner: false, accessLevel: "EDITOR", hasAccess: true, canEdit: true, canDownload: true, source: "PROJECT_OWNER" };
  }

  const candidates: { level: EffectiveAccessLevel; canDownload: boolean; source: EffectiveAccess["source"] }[] = [];
  if (directAccess) {
    candidates.push({ level: directAccess.accessLevel, canDownload: directAccess.canDownload, source: "DIRECT_SHARE" });
  }
  if (folderAccess.hasAccess) {
    candidates.push({ level: folderAccess.accessLevel as EffectiveAccessLevel, canDownload: folderAccess.canDownload, source: folderAccess.source });
  }

  if (candidates.length === 0) {
    return { isOwner: false, accessLevel: null, hasAccess: false, canEdit: false, canDownload: false, source: null };
  }

  const best = candidates.some((c: any) => c.level === "EDITOR")
    ? candidates.find((c: any) => c.level === "EDITOR")!
    : candidates[0];

  return {
    isOwner: false,
    accessLevel: best.level,
    hasAccess: true,
    canEdit: best.level === "EDITOR",
    canDownload: best.canDownload,
    source: best.source,
  };
}

export const documentAccessInclude = {
  sharedAccess: true,
  folder: { include: folderAccessInclude },
} as const;

export async function getDocumentAccess(userId: string, documentId: string) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: documentAccessInclude,
  });
  return { document, access: resolveDocumentAccess(userId, document) };
}
