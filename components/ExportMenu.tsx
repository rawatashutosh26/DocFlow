"use client";

import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, FileType, FileText, FileCode, Loader2 } from 'lucide-react';

interface ExportMenuProps {
  documentId: string;
  documentTitle: string;
}

const FORMATS: { id: string; label: string; icon: React.ElementType; hint: string; color: string }[] = [
  { id: 'docx', label: 'Microsoft Word (.docx)', icon: FileType, hint: 'Formatted docx document', color: 'text-blue-600' },
  { id: 'pdf', label: 'PDF Document (.pdf)', icon: FileType, hint: 'Print-ready snapshot', color: 'text-rose-600' },
  { id: 'md', label: 'Markdown (.md)', icon: FileCode, hint: 'Raw markdown format', color: 'text-indigo-600' },
  { id: 'txt', label: 'Plain Text (.txt)', icon: FileText, hint: 'Unformatted plain text', color: 'text-slate-600' },
  { id: 'html', label: 'HTML File (.html)', icon: FileCode, hint: 'Web page format', color: 'text-emerald-600' },
];

export default function ExportMenu({ documentId, documentTitle }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: string) => {
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/documents/${documentId}/export?format=${format}`);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Failed to export as .${format}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch {
      alert('An unexpected error occurred while exporting');
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200/90 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Export</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 p-1.5 animate-slide-up">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Export Options
          </p>
          <div className="divide-y divide-slate-100">
            {FORMATS.map((fmt) => {
              const Icon = fmt.icon;
              const isDownloading = downloadingFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => handleExport(fmt.id)}
                  disabled={downloadingFormat !== null}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 rounded-xl disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                  ) : (
                    <Icon className={`w-4 h-4 ${fmt.color} flex-shrink-0`} />
                  )}
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{fmt.label}</p>
                    <p className="text-[10px] text-slate-400">{fmt.hint}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
