import { useState, useCallback, useRef } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileDropZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export default function FileDropZone({ onFileSelect, disabled }: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
      return;
    }
    setFileName(file.name);
    onFileSelect(file);
  }, [onFileSelect]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile, disabled]);

  return (
    <div
      className={`drop-zone ${dragOver ? 'drag-over' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <AnimatePresence mode="wait">
        {fileName ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <FileSpreadsheet className="h-12 w-12 text-primary" />
            <p className="text-lg font-semibold text-foreground">{fileName}</p>
            <p className="text-sm text-muted-foreground">Clica para trocar o ficheiro</p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
              <Upload className="h-12 w-12 text-primary/60" />
            </motion.div>
            <p className="text-lg font-semibold text-foreground">
              Arrasta o ficheiro aqui
            </p>
            <p className="text-sm text-muted-foreground">
              ou clica para selecionar (.csv, .xlsx)
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
