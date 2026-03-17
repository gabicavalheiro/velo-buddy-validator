import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileDropZone from '@/components/FileDropZone';
import ErrorDashboard from '@/components/ErrorDashboard';
import { FILE_TYPES } from '@/lib/validationRules';
import { parseFile, validateWorkbook, type ValidationResult } from '@/lib/validateFile';
import { Loader2, Upload, LayoutDashboard, CheckCircle2, BookOpen } from 'lucide-react';
import confetti from 'canvas-confetti';
import logoVelo from '@/assets/logo-velo.png';
import GuideDrawer from '@/components/GuideDrawer';

const Index = () => {
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

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
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#7c3aed', '#ea580c', '#a855f7', '#f97316'] });
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

  const totalErrors = result
    ? result.columnErrors.length + result.cellErrors.reduce((sum, e) => sum + e.failCount, 0)
    : 0;

  return (
    <>
    <div className="min-h-screen min-h-dvh flex flex-col md:flex-row">

      
        

      {/* Faixa topo — só mobile */}
      <div
        className="md:hidden flex items-center justify-between py-3 px-4"
        style={{ background: 'linear-gradient(90deg, hsl(300 60% 20%) 0%, hsl(340 55% 30%) 100%)' }}
      >
        <img src={logoVelo} alt="Velo Sistema de Gestão" className="h-9 w-auto" />
        <button
          onClick={() => setGuideOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-semibold"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Guia
        </button>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-6 sm:py-10 bg-background overflow-y-auto">
        <div className="w-full max-w-2xl">

          {/* Logo — só desktop */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex flex-col items-center mb-8 relative w-full"
          >
            <button
              onClick={() => setGuideOpen(true)}
              className="absolute top-0 right-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: 'hsl(270 60% 38% / 0.08)', color: 'hsl(270 60% 38%)', border: '1px solid hsl(270 60% 38% / 0.2)' }}
            >
              <BookOpen className="h-4 w-4" />
              Guia Rápido
            </button>
            <img src={logoVelo} alt="Velo Sistema de Gestão" className="h-16 lg:h-20 w-auto mb-4 select-none" />
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-foreground">Validador de Planilhas</h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm mt-1 leading-relaxed">
              Carregue o ficheiro e verifique se está pronto para importação.
            </p>
          </motion.div>

          {/* Título mobile */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden text-center mb-5 mt-2"
          >
            <h1 className="text-lg font-bold font-heading text-foreground">Validador de Planilhas</h1>
            <p className="text-xs text-muted-foreground mt-1">Carregue o ficheiro e verifique se está pronto para importação.</p>
          </motion.div>

          {/* Banner de sucesso */}
          {result?.success && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-4 sm:p-6 text-center shadow-card mb-5"
              style={{ background: 'hsl(var(--success) / 0.08)', border: '1px solid hsl(var(--success) / 0.2)' }}
            >
              <CheckCircle2 className="mx-auto h-8 w-8 sm:h-10 sm:w-10 mb-2" style={{ color: 'hsl(var(--success))' }} />
              <h2 className="text-base sm:text-lg font-bold font-heading text-foreground mb-1">Tudo perfeito! 🎉</h2>
              <p className="text-muted-foreground text-xs sm:text-sm">As colunas e células estão corretas. Pode importar sem problemas!</p>
              <p className="mt-1 text-xs text-muted-foreground">{result.rowCount} linhas analisadas em <strong className="break-all">{fileName}</strong></p>
            </motion.div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList
              className="w-full grid grid-cols-2 h-11 rounded-xl p-1 mb-4"
              style={{ background: 'hsl(270 20% 90%)' }}
            >
              <TabsTrigger value="upload" className="rounded-lg text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:shadow-soft data-[state=active]:text-primary">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Inserir Ficheiro</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="rounded-lg text-xs sm:text-sm font-semibold gap-1.5 data-[state=active]:shadow-soft data-[state=active]:text-primary relative">
                <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Dashboard de Erros</span>
                {result && !result.success && totalErrors > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1"
                    style={{ background: 'hsl(18 90% 52%)' }}
                  >
                    {totalErrors}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-0">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Tipo de ficheiro</label>
                  <Select value={fileType} onValueChange={(val) => { setFileType(val); setResult(null); }}>
                    <SelectTrigger className="w-full rounded-xl h-11 sm:h-12 text-sm sm:text-base shadow-soft bg-card border-border">
                      <SelectValue placeholder="Escolha o tipo de ficheiro..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FILE_TYPES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FileDropZone onFileSelect={handleFileSelect} disabled={!fileType} />
                  {!fileType && (
                    <p className="text-xs text-muted-foreground text-center mt-2">Selecione primeiro o tipo de ficheiro acima ☝️</p>
                  )}
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(270 60% 38%)' }} />
                    <span className="text-muted-foreground text-sm font-medium">A validar o ficheiro...</span>
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="dashboard" className="mt-0">
              <ErrorDashboard result={result} fileName={fileName} fileTypeLabel={fileType ? FILE_TYPES[fileType]?.label ?? '' : ''} />
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>

      <GuideDrawer open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
};

export default Index;