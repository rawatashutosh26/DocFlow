"use client";

import { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Share2, 
  Lock, 
  Unlock, 
  UploadCloud, 
  Star, 
  Send, 
  FileCode, 
  FileSpreadsheet, 
  FileImage, 
  FileAudio, 
  FileVideo, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import ShareModal from './ShareModal';
import SubmitForApprovalModal from './SubmitForApprovalModal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useColumnPreferences } from './ColumnPreferencesProvider';

export type Document = {
  id: string;
  title: string;
  size: number;
  updatedAt: string;
  version: number;
  isLocked: boolean;
  lockedById: string | null;
  status?: string;
  isStarred?: boolean;
  ownerId?: string;
};

interface FileListTableProps {
  documents: Document[];
  currentUserId?: string; 
}

export default function FileListTable({ documents, currentUserId }: FileListTableProps) {
  const router = useRouter();
  const { isVisible } = useColumnPreferences();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [shareModalState, setShareModalState] = useState<{isOpen: boolean, docId: string, docTitle: string}>({
    isOpen: false, docId: '', docTitle: ''
  });
  const [submitModalState, setSubmitModalState] = useState<{isOpen: boolean, docId: string, docTitle: string}>({
    isOpen: false, docId: '', docTitle: ''
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const getFileIcon = (title: string) => {
    const ext = title.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return <FileText className="h-4.5 w-4.5 text-rose-500" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
      case 'gif':
        return <FileImage className="h-4.5 w-4.5 text-purple-500" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="h-4.5 w-4.5 text-amber-500" />;
      case 'mp4':
      case 'webm':
        return <FileVideo className="h-4.5 w-4.5 text-blue-500" />;
      case 'js':
      case 'ts':
      case 'json':
      case 'html':
      case 'css':
        return <FileCode className="h-4.5 w-4.5 text-cyan-500" />;
      default:
        return <FileText className="h-4.5 w-4.5 text-zinc-600" />;
    }
  };

  const handleDownload = (id: string, title: string) => {
    const url = `/api/files/${id}?download=1`;
    const a = document.createElement('a');
    a.href = url;
    a.download = title; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/files/${id}`);
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/documents/${doc.id}/delete`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || 'Failed to delete document');
      } else {
        router.refresh();
      }
    } catch {
      alert('An unexpected error occurred while deleting');
    }
  };

  const handleLockToggle = async (doc: Document) => {
    const action = doc.isLocked ? 'unlock' : 'lock';
    
    try {
      const res = await fetch(`/api/documents/${doc.id}/${action}`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || `Failed to ${action} document`);
      } else {
        router.refresh(); 
      }
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handleVersionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeUploadId) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/documents/${activeUploadId}/update`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to upload new version');
      } else {
        router.refresh();
      }
    } catch {
      alert('An unexpected error occurred during upload.');
    } finally {
      setActiveUploadId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (id: string) => {
    setActiveUploadId(id);
    fileInputRef.current?.click();
  };

  const handleStarToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/star`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to update star');
        return;
      }
      router.refresh();
    } catch {
      alert('An unexpected error occurred');
    }
  };

  const handleSubmitForApproval = (doc: Document) => {
    setSubmitModalState({ isOpen: true, docId: doc.id, docTitle: doc.title });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Needs Changes
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
            Draft
          </span>
        );
    }
  };

  return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleVersionUpload} 
        className="hidden" 
      />

      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden transition-all">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50/75">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Document Name
              </th>
              {isVisible('size') && (
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  File Size
                </th>
              )}
              {isVisible('updatedAt') && (
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Last Modified
                </th>
              )}
              {isVisible('version') && (
                <th scope="col" className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Version
                </th>
              )}
              <th scope="col" className="relative px-6 py-3 text-right text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {documents.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-zinc-400 text-xs">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center mb-2.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-zinc-700">No documents found</p>
                    <p className="text-xs text-zinc-400 mt-1">Upload a document or create a new rich-text document to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50/70 transition-colors group">
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center flex-shrink-0 group-hover:bg-zinc-200 transition-colors">
                        {getFileIcon(doc.title)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/dashboard/files/${doc.id}`} 
                            className="text-xs font-semibold text-zinc-900 hover:underline transition-colors truncate max-w-xs md:max-w-md block"
                          >
                            {doc.title}
                          </Link>
                          {isVisible('status') && doc.status && getStatusBadge(doc.status)}
                          {doc.isLocked && (
                            <span 
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                doc.lockedById === currentUserId 
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              <Lock className="w-3 h-3 mr-1" /> 
                              {doc.lockedById === currentUserId ? 'Locked by You' : 'Checked Out'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {isVisible('size') && (
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs font-medium text-zinc-500">
                      {formatBytes(doc.size)}
                    </td>
                  )}

                  {isVisible('updatedAt') && (
                    <td className="px-6 py-3.5 whitespace-nowrap text-xs text-zinc-500">
                      {formatDate(doc.updatedAt)}
                    </td>
                  )}

                  {isVisible('version') && (
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200/60">
                        v{doc.version}.0
                      </span>
                    </td>
                  )}

                  <td className="px-6 py-3.5 whitespace-nowrap text-right text-xs font-medium">
                    <div className="flex items-center justify-end space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      
                      {(doc.status === 'DRAFT' || doc.status === 'REJECTED') && (
                        <button
                          onClick={() => handleSubmitForApproval(doc)}
                          className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2 py-1 rounded-md flex items-center text-xs font-medium mr-1.5 transition-colors cursor-pointer"
                          title="Submit for review & approval"
                        >
                          <Send className="w-3 h-3 mr-1 text-emerald-600" /> Submit
                        </button>
                      )}

                      {doc.isLocked && doc.lockedById === currentUserId && (
                        <button 
                          onClick={() => triggerUpload(doc.id)}
                          className="text-zinc-50 bg-zinc-900 hover:bg-zinc-800 px-2.5 py-1 rounded-md flex items-center text-xs font-medium mr-1.5 transition-colors cursor-pointer shadow-xs"
                          title="Upload new version"
                        >
                          <UploadCloud className="w-3 h-3 mr-1" /> New Version
                        </button>
                      )}

                      <button 
                        onClick={() => handleLockToggle(doc)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          doc.isLocked 
                            ? 'text-amber-600 hover:bg-amber-50' 
                            : 'text-zinc-400 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                        title={doc.isLocked ? "Check In (Unlock document)" : "Check Out (Lock document for exclusive editing)"}
                      >
                        {doc.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleStarToggle(doc.id)}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          doc.isStarred 
                            ? 'text-amber-500 hover:bg-amber-50' 
                            : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50'
                        }`}
                        title={doc.isStarred ? 'Unstar' : 'Star'}
                      >
                        <Star className={`w-3.5 h-3.5 ${doc.isStarred ? 'fill-current' : ''}`} />
                      </button>

                      <button 
                        onClick={() => setShareModalState({ isOpen: true, docId: doc.id, docTitle: doc.title })}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                        title="Share Document"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button 
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      
                      <button
                        onClick={() => handleEdit(doc.id)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                        title="Open in Editor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ShareModal 
        isOpen={shareModalState.isOpen}
        onClose={() => setShareModalState((prev) => ({ ...prev, isOpen: false }))}
        documentId={shareModalState.docId}
        documentTitle={shareModalState.docTitle}
      />

      <SubmitForApprovalModal
        isOpen={submitModalState.isOpen}
        onClose={() => setSubmitModalState((prev) => ({ ...prev, isOpen: false }))}
        documentId={submitModalState.docId}
        documentTitle={submitModalState.docTitle}
      />
    </>
  );
}