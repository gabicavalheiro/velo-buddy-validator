import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FileDropZone from '@/components/FileDropZone';
import ValidationResults from '@/components/ValidationResults';
import { FILE_TYPES } from '@/lib/validationRules';
import { parseFile, validateWorkbook, type ValidationResult } from '@/lib/validateFile';
import { Loader2, ShieldCheck } from 'lucide-react';

const Index = () => {
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!fileType) return;
    setLoading(true);
    setResult(null);
    try {
      const workbook = await parseFile(file);
      const config = FILE_TYPES[fileType];
      const validationResult = validateWorkbook(workbook, config);
      setResult(validationResult);
    } catch {
      setResult({
        success: false,
        columnErrors: [{ column: '(Erro ao ler o ficheiro. Verifica se o formato é válido.)' }],
        cellErrors: [],
        rowCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-6">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Validador Velo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-4">
            Validador de Planilhas
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            Olá! Carrega aqui o teu ficheiro e nós ajudamos a garantir que a importação corre na perfeição. 😊
          </p>
        </motion.div>

        {/* File Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <label className="block text-sm font-semibold text-foreground mb-2">
            Tipo de ficheiro
          </label>
          <Select
            value={fileType}
            onValueChange={(val) => {
              setFileType(val);
              setResult(null);
            }}
          >
            <SelectTrigger className="w-full rounded-xl h-12 text-base shadow-soft bg-card">
              <SelectValue placeholder="Escolhe o tipo de ficheiro..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FILE_TYPES).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <FileDropZone onFileSelect={handleFileSelect} disabled={!fileType} />
          {!fileType && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Seleciona primeiro o tipo de ficheiro acima ☝️
            </p>
          )}
        </motion.div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground font-medium">A validar o ficheiro...</span>
          </div>
        )}

        {/* Results */}
        {result && !loading && <ValidationResults result={result} />}
      </div>
    </div>
  );
};

export default Index;
