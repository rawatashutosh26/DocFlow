import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import { 
  Activity, 
  FileText, 
  Share2, 
  Lock, 
  Unlock, 
  Download, 
  Plus, 
  UploadCloud, 
  ScrollText, 
  Eye, 
  Clock 
} from "lucide-react";
import Link from "next/link";

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id;

  const logs = await prisma.auditLog.findMany({
    where: { userId: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      document: {
        select: { title: true, id: true }
      }
    },
    take: 50,
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "DOCUMENT_CREATED":
        return {
          icon: <Plus className="w-4 h-4 text-emerald-600" />,
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          label: "Created",
        };
      case "DOCUMENT_UPLOADED":
        return {
          icon: <UploadCloud className="w-4 h-4 text-blue-600" />,
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          label: "Uploaded",
        };
      case "DOCUMENT_EDITED":
        return {
          icon: <FileText className="w-4 h-4 text-indigo-600" />,
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          label: "Edited",
        };
      case "DOCUMENT_SHARED":
        return {
          icon: <Share2 className="w-4 h-4 text-purple-600" />,
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          label: "Shared",
        };
      case "DOCUMENT_LOCKED":
        return {
          icon: <Lock className="w-4 h-4 text-amber-600" />,
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          label: "Locked",
        };
      case "DOCUMENT_UNLOCKED":
        return {
          icon: <Unlock className="w-4 h-4 text-teal-600" />,
          bg: "bg-teal-50 text-teal-700 border-teal-200",
          label: "Unlocked",
        };
      case "DOCUMENT_DOWNLOADED":
        return {
          icon: <Download className="w-4 h-4 text-cyan-600" />,
          bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
          label: "Downloaded",
        };
      case "DOCUMENT_VIEWED":
        return {
          icon: <Eye className="w-4 h-4 text-slate-600" />,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          label: "Viewed",
        };
      default:
        return {
          icon: <Activity className="w-4 h-4 text-slate-600" />,
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          label: action.replace("DOCUMENT_", "").replace("_", " "),
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <ScrollText className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit Log</h1>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              {logs.length} events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident chronological record of all document events, permissions, and checkouts.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-16 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <ScrollText className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-700 text-sm">No activity logs recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">Actions you take on documents will automatically be audited here.</p>
            </div>
          ) : (
            logs.map((log) => {
              const meta = getActionBadge(log.action);
              return (
                <div key={log.id} className="p-4.5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta.bg}`}>
                          {meta.label}
                        </span>
                        {log.document && (
                          <Link 
                            href={`/dashboard/files/${log.document.id}`}
                            className="text-xs font-bold text-slate-900 hover:text-indigo-600 hover:underline truncate"
                          >
                            {log.document.title}
                          </Link>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {log.details || "Activity recorded successfully."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
