"use client";

import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import UploadModal from './UploadModal';

interface UploadButtonProps {
  ownerId: string;
}

export default function UploadButton({ ownerId }: UploadButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
        title="Upload a new document"
      >
        <UploadCloud className="w-4 h-4 text-zinc-300" />
        <span>Upload</span>
      </button>

      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        ownerId={ownerId} 
      />
    </>
  );
}