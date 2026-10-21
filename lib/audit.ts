import prisma from "./db";

type AuditAction = 
  | "DOCUMENT_CREATED" 
  | "DOCUMENT_UPLOADED" 
  | "DOCUMENT_EDITED" 
  | "DOCUMENT_SHARED" 
  | "DOCUMENT_LOCKED" 
  | "DOCUMENT_UNLOCKED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_DELETED"
  | "DOCUMENT_VERSION_UPLOADED"
  | "FOLDER_CREATED"
  | "DOCUMENT_STARRED"
  | "DOCUMENT_UNSTARRED"
  | "DOCUMENT_RESTORED"
  | "DOCUMENT_PERMANENTLY_DELETED"
  | "DOCUMENT_SUBMITTED_FOR_APPROVAL"
  | "DOCUMENT_APPROVED"
  | "DOCUMENT_REJECTED"
  | "DOCUMENT_VIEWED"
  | "DOCUMENT_VERSION_RESTORED"
  | "TEAM_CREATED"
  | "TEAM_MEMBER_ADDED"
  | "TEAM_MEMBER_REMOVED"
  | "FOLDER_LOCKED"
  | "FOLDER_UNLOCKED"
  | "FOLDER_TEAM_ASSIGNED"
  | "FOLDER_SHARED"
  | "FOLDER_ACCESS_REVOKED"
  | "FOLDER_TEAM_SHARED"
  | "FOLDER_TEAM_SHARE_REMOVED"
  | "ACCESS_REQUESTED"
  | "ACCESS_REQUEST_APPROVED"
  | "ACCESS_REQUEST_DENIED";

interface LogAuditParams {
  action: AuditAction;
  userId: string;
  documentId?: string;
  details?: string;
}

export async function logAudit({ action, userId, documentId, details }: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        documentId,
        details,
      },
    });
  } catch (error) {
    // We catch the error so a failed audit log doesn't crash the main user action
    console.error("Failed to write audit log:", error);
  }
}