import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { 
  Search, 
  Car, 
  Database,
  X,
  Filter,
  RefreshCw,
  Loader2,
  Hash,
  Target,
  Wifi,
  WifiOff,
  CloudOff,
  Zap
} from 'lucide-react';
import VehicleCard from './components/VehicleCard';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { initUpdater } from './utils/updater';
import { saveToCache, loadFromCache, getCacheInfo } from './utils/cache';
import { loadDataWithFallback } from './utils/googleSheets';

const cn = (...inputs) => twMerge(clsx(inputs));

// Função auxiliar para converter qualquer valor para string de forma segura
const safeString = (value) => {
  if (value === null || value === undefined) return '';
  return String(value);
};

// Hook de debounce para otimizar busca
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

function App() {
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('all'); // 'all' ou 'adesivo'
  const [exactMatch, setExactMatch] = useState(false); // busca exata
  const [isOnline, setIsOnlineState] = useState(navigator.onLine);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [dataSource, setDataSource] = useState(null); // 'json', 'excel', ou 'cache'
  const [cacheInfo, setCacheInfo] = useState(null);
  
  // Debounce da busca para melhor performance
  const debouncedSearch = useDebounce(searchQuery, 200);
  
  // Ref para o container da lista virtualizada
  const parentRef = useRef(null);

  // Inicializar verificador de atualizações
  useEffect(() => {
    initUpdater();
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnlineState(true);
    const handleOffline = () => setIsOnlineState(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Carregar dados - mostra cache primeiro, depois atualiza em background
  const loadFromLocal = useCallback(async (forceRefresh = false) => {
    // Atualiza info do cache
    const info = getCacheInfo();
    setCacheInfo(info);
    
    // 1. PRIMEIRO: Mostra cache imediatamente (se existir)
    const cachedData = loadFromCache();
    if (cachedData && cachedData.length > 0) {
      setVehicles(cachedData);
      setIsUsingCache(true);
      setDataSource('cache');
      setError(null);
      console.log('Cache carregado imediatamente:', cachedData.length, 'registros');
    }
    
    // 2. Se estiver offline, não tenta atualizar
    if (!navigator.onLine) {
      console.log('Offline - usando apenas cache');
      if (!cachedData) {
        setError('Sem conexão e sem dados em cache. Conecte-se à internet.');
        setIsLoading(false);
      }
      return;
    }
    
    // 3. Se não tem cache, mostra loading
    if (!cachedData || cachedData.length === 0) {
      setIsLoading(true);
    }
    
    setError(null);
    
    // 4. Tenta atualizar dados em background
    try {
      console.log('Atualizando dados em background...');
      const { data, source } = await loadDataWithFallback(XLSX);
      
      if (data.length === 0) {
        throw new Error('Os dados estão vazios');
      }
      
      // Salva no cache para uso offline
      saveToCache(data);
      setCacheInfo(getCacheInfo());
      
      setVehicles(data);
      setSearchQuery('');
      setError(null);
      setDataSource(source);
      setIsUsingCache(false);
      console.log('Dados atualizados via', source);
      
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      
      // Se falhou e tem cache, mantém o cache
      if (cachedData && cachedData.length > 0) {
        console.log('Mantendo cache devido a erro de atualização');
        // Não mostra erro, continua com cache
      } else {
        setError('Não foi possível carregar os dados. Verifique sua conexão.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega dados ao iniciar
  useEffect(() => {
    loadFromLocal();
  }, [loadFromLocal]);

  // Filtrar veículos com debounce
  const filteredVehicles = useMemo(() => {
    if (!debouncedSearch.trim()) return vehicles;
    
    const query = debouncedSearch.toLowerCase().trim();
    
    return vehicles.filter(vehicle => {
      // Modo apenas adesivos
      if (searchMode === 'adesivo') {
        for (let i = 1; i <= 5; i++) {
          const adesivo = safeString(vehicle[`Adesivo${i}`]).toLowerCase().trim();
          if (exactMatch) {
            // Busca exata
            if (adesivo === query) return true;
          } else {
            // Busca parcial
            if (adesivo.includes(query)) return true;
          }
        }
        return false;
      }
      
      // Modo todos os campos
      // Buscar em todas as placas
      for (let i = 1; i <= 5; i++) {
        const placa = safeString(vehicle[`Placa${i}`]).toLowerCase();
        if (exactMatch) {
          if (placa === query) return true;
        } else {
          if (placa.includes(query)) return true;
        }
      }
      
      // Buscar em todos os adesivos
      for (let i = 1; i <= 5; i++) {
        const adesivo = safeString(vehicle[`Adesivo${i}`]).toLowerCase();
        if (exactMatch) {
          if (adesivo === query) return true;
        } else {
          if (adesivo.includes(query)) return true;
        }
      }
      
      // Buscar em todas as marcas/modelos
      for (let i = 1; i <= 5; i++) {
        const marcaModelo = safeString(vehicle[`Marca/Modelo${i}`]).toLowerCase();
        if (exactMatch) {
          if (marcaModelo === query) return true;
        } else {
          if (marcaModelo.includes(query)) return true;
        }
      }
      
      // Buscar em todos os alunos
      for (let i = 1; i <= 4; i++) {
        const aluno = safeString(vehicle[`Aluno${i}`]).toLowerCase();
        if (exactMatch) {
          if (aluno === query) return true;
        } else {
          if (aluno.includes(query)) return true;
        }
      }
      
      // Buscar nos responsáveis
      const pai = safeString(vehicle.Pai).toLowerCase();
      const mae = safeString(vehicle.Mãe).toLowerCase();
      const identificacao = safeString(vehicle.Identificação).toLowerCase();
      
      if (exactMatch) {
        if (pai === query || mae === query || identificacao === query) return true;
      } else {
        if (pai.includes(query) || mae.includes(query) || identificacao.includes(query)) return true;
      }
      
      // Buscar em email e celular
      const emailPai = safeString(vehicle['Email Pai']).toLowerCase();
      const emailMae = safeString(vehicle['Email Mãe']).toLowerCase();
      const celular = safeString(vehicle.Celular).toLowerCase();
      const telefoneResidencial = safeString(vehicle['Telefone Residencial']).toLowerCase();
      
      if (exactMatch) {
        if (emailPai === query || emailMae === query || celular === query || telefoneResidencial === query) return true;
      } else {
        if (emailPai.includes(query) || emailMae.includes(query) || celular.includes(query) || telefoneResidencial.includes(query)) return true;
      }
      
      return false;
    });
  }, [vehicles, debouncedSearch, searchMode, exactMatch]);

  // Virtualizador com medição dinâmica de cada card
  const rowVirtualizer = useVirtualizer({
    count: filteredVehicles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
    measureElement: (element) => {
      return element?.offsetHeight || 220;
    },
  });

  const vehicleCount = vehicles.length;
  const filteredCount = filteredVehicles.length;

  return (
    <div className="min-h-screen bg-slate-50 safe-top safe-bottom">
      {/* Fixed Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="px-4 py-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Controle de Veículos
                </h1>
                <p className="text-xs text-slate-400">
                  {isLoading ? 'Carregando...' : 
                   vehicleCount > 0 
                    ? `${vehicleCount} cadastro${vehicleCount !== 1 ? 's' : ''}`
                    : 'Nenhum cadastro'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Status de conexão e fonte de dados */}
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                !isOnline 
                  ? "bg-red-100 text-red-700"
                  : dataSource === 'json'
                    ? "bg-blue-100 text-blue-700"
                    : dataSource === 'excel'
                      ? "bg-amber-100 text-amber-700"
                      : dataSource === 'cache'
                        ? "bg-purple-100 text-purple-700"
                        : "bg-green-100 text-green-700"
              )}>
                {!isOnline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Offline</span>
                  </>
                ) : dataSource === 'json' ? (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Rápido</span>
                  </>
                ) : dataSource === 'excel' ? (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excel</span>
                  </>
                ) : dataSource === 'cache' ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cache</span>
                  </>
                ) : (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Online</span>
                  </>
                )}
              </div>
              
              <button
                onClick={loadFromLocal}
                disabled={isLoading}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                  isLoading 
                    ? "bg-slate-100 text-slate-400" 
                    : "bg-green-100 hover:bg-green-200 text-green-600"
                )}
                title="Recarregar dados"
              >
                <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Search Bar */}
          {vehicleCount > 0 && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchMode === 'adesivo' ? "Buscar por número do adesivo..." : "Buscar por placa, adesivo, marca, modelo, nome, email ou celular..."}
                  className="input-search pl-12 pr-4"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}
              </div>
              
              {/* Toggle de modo de busca */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchMode(searchMode === 'adesivo' ? 'all' : 'adesivo')}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    searchMode === 'adesivo' 
                      ? "bg-primary-500 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Hash className="w-3.5 h-3.5" />
                  Apenas Adesivos
                </button>
                
                <button
                  onClick={() => setExactMatch(!exactMatch)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    exactMatch 
                      ? "bg-amber-500 text-white" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  <Target className="w-3.5 h-3.5" />
                  Busca Exata
                </button>
                
                {(searchMode === 'adesivo' || exactMatch) && (
                  <span className="text-xs text-slate-400 hidden sm:inline">
                    {searchMode === 'adesivo' && exactMatch && "Busca exata apenas no adesivo"}
                    {searchMode === 'adesivo' && !exactMatch && "Busca parcial no adesivo"}
                    {searchMode !== 'adesivo' && exactMatch && "Busca exata em todos os campos"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        {isLoading ? (
          /* Loading State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Carregando dados...
            </h3>
            <p className="text-sm text-slate-500">Aguarde um momento</p>
          </div>
        ) : error && vehicleCount === 0 ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Nenhum dado carregado
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs">{error}</p>
          </div>
        ) : filteredCount === 0 ? (
          /* No Results State */
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Nenhum resultado
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Não encontramos cadastros para "{searchQuery}"
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          /* Virtualized List */
          <div
            ref={parentRef}
            className="overflow-y-auto"
            style={{ height: 'calc(100vh - 180px)' }}
          >
            {/* Results Count */}
            {searchQuery && (
              <p className="text-sm text-slate-500 mb-4">
                Mostrando {filteredCount} de {vehicleCount} cadastro{filteredCount !== 1 ? 's' : ''}
              </p>
            )}
            
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="pb-3">
                    <VehicleCard 
                      vehicle={filteredVehicles[virtualItem.index]} 
                      searchQuery={debouncedSearch}
                      searchMode={searchMode}
                      exactMatch={exactMatch}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;