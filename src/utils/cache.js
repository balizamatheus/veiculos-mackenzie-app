/**
 * Utilitário de cache offline para dados do Excel
 * Usa localStorage para armazenar os dados
 */

const CACHE_KEY = 'veiculos_cache_data';
const CACHE_TIMESTAMP_KEY = 'veiculos_cache_timestamp';
const CACHE_VERSION_KEY = 'veiculos_cache_version';
const CACHE_VERSION = '1.0';

/**
 * Salva os dados no cache local
 * @param {Array} data - Array de veículos para salvar
 */
export const saveToCache = (data) => {
  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(CACHE_KEY, jsonData);
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    console.log('Dados salvos no cache:', data.length, 'veículos');
    return true;
  } catch (error) {
    console.error('Erro ao salvar no cache:', error);
    // Se o localStorage estiver cheio, tenta limpar dados antigos
    if (error.name === 'QuotaExceededError') {
      clearCache();
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
        localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
        return true;
      } catch (e) {
        console.error('Não foi possível salvar mesmo após limpar cache:', e);
      }
    }
    return false;
  }
};

/**
 * Carrega os dados do cache local
 * @returns {Array|null} Array de veículos ou null se não houver cache
 */
export const loadFromCache = () => {
  try {
    const jsonData = localStorage.getItem(CACHE_KEY);
    const version = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (!jsonData) {
      console.log('Nenhum dado em cache');
      return null;
    }
    
    // Verifica se a versão do cache é compatível
    if (version !== CACHE_VERSION) {
      console.log('Versão do cache incompatível, limpando...');
      clearCache();
      return null;
    }
    
    const data = JSON.parse(jsonData);
    console.log('Dados carregados do cache:', data.length, 'veículos');
    return data;
  } catch (error) {
    console.error('Erro ao carregar do cache:', error);
    return null;
  }
};

/**
 * Limpa o cache local
 */
export const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    localStorage.removeItem(CACHE_VERSION_KEY);
    console.log('Cache limpo');
    return true;
  } catch (error) {
    console.error('Erro ao limpar cache:', error);
    return false;
  }
};

/**
 * Retorna informações sobre o cache
 * @returns {Object} Informações do cache
 */
export const getCacheInfo = () => {
  try {
    const jsonData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    const version = localStorage.getItem(CACHE_VERSION_KEY);
    
    if (!jsonData) {
      return { exists: false };
    }
    
    const data = JSON.parse(jsonData);
    const sizeInBytes = new Blob([jsonData]).size;
    
    return {
      exists: true,
      count: data.length,
      timestamp: timestamp ? parseInt(timestamp) : null,
      version: version,
      sizeInKB: Math.round(sizeInBytes / 1024),
      lastUpdate: timestamp ? new Date(parseInt(timestamp)).toLocaleString('pt-BR') : null
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};

/**
 * Verifica se há dados em cache
 * @returns {boolean}
 */
export const hasCache = () => {
  return localStorage.getItem(CACHE_KEY) !== null;
};

/**
 * Verifica se o dispositivo está online
 * @returns {boolean}
 */
export const isOnline = () => {
  return navigator.onLine;
};
