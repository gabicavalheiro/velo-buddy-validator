import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileDropZone from '@/components/FileDropZone';
import ErrorDashboard from '@/components/ErrorDashboard';
import { FILE_TYPES } from '@/lib/validationRules';
import { parseFile, validateWorkbook, type ValidationResult } from '@/lib/validateFile';
import { Loader2, ShieldCheck, Upload, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const Index = () => {
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (file: File) => {
    if (!fileType) return;
    setLoading(true);
    setResult(null);
    setFileName(file.name);
    try {
      const workbook = await parseFile(file);
      const config = FILE_TYPES[fileType];
      const validationResult = validateWorkbook(workbook, config);
      setResult(validationResult);
      if (validationResult.success) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#34d399', '#fbbf24', '#60a5fa', '#f472b6'] });
      } else {
        setActiveTab('dashboard');
      }
    } catch {
      setResult({
        success: false,
        columnErrors: [{ column: '(Erro ao ler o ficheiro. Verifica se o formato é válido.)' }],
        cellErrors: [],
        rowCount: 0,
      });
      setActiveTab('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const totalErrors = result ? result.columnErrors.length + result.cellErrors.reduce((sum, e) => sum + e.failCount, 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:py-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Validador Velo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading text-foreground mb-3">
            Validador de Planilhas
          </h1>
          <p className="text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
            Olá! Carrega aqui o teu ficheiro e nós ajudamos a garantir que a importação corre na perfeição. 😊
          </p>
        </motion.div>

        {/* Success banner */}
        {result?.success && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-6 text-center shadow-card mb-8"
            style={{ background: 'hsl(var(--success) / 0.08)' }}
          >
            <CheckCircle2 className="mx-auto h-12 w-12 text-success mb-3" />
            <h2 className="text-xl font-bold font-heading text-foreground mb-1">Tudo perfeito! 🎉</h2>
            <p className="text-muted-foreground">As colunas e as células têm a formatação exata. Podes importar sem medo!</p>
            <p className="mt-2 text-sm text-muted-foreground">{result.rowCount} linhas analisadas em <strong>{fileName}</strong></p>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 h-12 rounded-xl bg-muted p-1 mb-6">
            <TabsTrigger value="upload" className="rounded-lg text-sm font-semibold gap-2 data-[state=active]:shadow-soft">
              <Upload className="h-4 w-4" />
              Inserir Ficheiro
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-lg text-sm font-semibold gap-2 data-[state=active]:shadow-soft relative">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard de Erros
              {result && !result.success && totalErrors > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
                  {totalErrors}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* File Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Tipo de ficheiro</label>
                <Select
                  value={fileType}
                  onValueChange={(val) => { setFileType(val); setResult(null); }}
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
              </div>

              {/* Drop Zone */}
              <div>
                <FileDropZone onFileSelect={handleFileSelect} disabled={!fileType} />
                {!fileType && (
                  <p className="text-xs text-muted-foreground text-center mt-2">Seleciona primeiro o tipo de ficheiro acima ☝️</p>
                )}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-muted-foreground font-medium">A validar o ficheiro...</span>
                </div>
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-0">
            <ErrorDashboard result={result} fileName={fileName} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
