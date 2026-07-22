import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FileDropZone from '@/components/FileDropZone';
import ErrorDashboard from '@/components/ErrorDashboard';
import { FILE_TYPES } from '@/lib/validationRules';
import { parseFile, validateWorkbook, type ValidationResult } from '@/lib/validateFile';
import { Loader2, Upload, LayoutDashboard, CheckCircle2, BookOpen, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import confetti from 'canvas-confetti';
import logoVelo from '@/assets/logo-velo.png';
import GuideDrawer from '@/components/GuideDrawer';

// Cede o controlo ao browser por um frame antes de executar trabalho pesado.
// Garante que o spinner "A validar o ficheiro..." aparece antes de bloquear a thread.
function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

const Index = () => {
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [fileName, setFileName] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleFileSelect = async (file: File) => {
    if (!fileType) return;
    setLoading(true);
    setResult(null);
    setFileName(file.name);

    // Aguarda o próximo frame para o React pintar o spinner antes de bloquear a thread
    await yieldToUI();

    try {
      const workbook = await parseFile(file);
      const config = FILE_TYPES[fileType];

      // Cede mais um frame — parseFile é async e o browser pode não ter repintado ainda
      await yieldToUI();

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
        ghostRowCount: 0,
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">

        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <img src={logoVelo} alt="Velo" className="h-10 sm:h-12" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Alternar modo escuro"
              title="Alternar modo escuro"
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-xl border border-border bg-card shadow-soft hover:bg-muted/50 transition-colors"
            >
              {theme === 'dark'
                ? <Sun className="h-4 w-4 text-foreground" />
                : <Moon className="h-4 w-4 text-foreground" />
              }
            </button>
            <button
              onClick={() => setGuideOpen(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold text-foreground shadow-soft hover:bg-muted/50 transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Guia Rápido
            </button>
            <button
              onClick={() => setGuideOpen(true)}
              className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground shadow-soft"
            >
              <BookOpen className="h-3.5 w-3.5" />
              Guia
            </button>
          </div>
        </div>

        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground mb-2">Validador de Planilhas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Carregue o ficheiro e verifique se está pronto para importação.</p>
        </div>

        <div className="bg-card rounded-2xl shadow-card border border-border p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-5 sm:mb-6 h-11 sm:h-12 rounded-xl bg-muted p-1">
              <TabsTrigger value="upload" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Inserir Ficheiro
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm rounded-lg relative data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Dashboard de Erros
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
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
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