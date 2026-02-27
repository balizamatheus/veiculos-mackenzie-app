/**
 * Utilitário para carregar dados do Google Sheets em formato JSON
 * O Google Visualization API retorna um formato específico que precisa ser parseado
 * 
 * Lógica de resiliência:
 * 1. Primeiro tenta usar as variáveis de ambiente (VITE_JSON_URL, VITE_EXCEL_URL)
 * 2. Se não existirem (undefined), tenta carregar do Capacitor Preferences
 * 3. Se encontrar no preferences, salva em cache para uso offline
 */

import { Preferences } from '@capacitor/preferences';

// URLs do ambiente (embutidas no APK)
const ENV_JSON_URL = import.meta.env.VITE_JSON_URL;
const ENV_EXCEL_URL = import.meta.env.VITE_EXCEL_URL;

// Keys para o Preferences
const PREFERENCES_JSON_URL_KEY = 'config_json_url';
const PREFERENCES_EXCEL_URL_KEY = 'config_excel_url';

/**
 * Carrega as URLs do Preferences (armazenamento persistente)
 * @returns {Promise<{jsonUrl: string|null, excelUrl: string|null}>}
 */
const loadUrlsFromPreferences = async () => {
  try {
    const jsonUrl = await Preferences.get({ key: PREFERENCES_JSON_URL_KEY });
    const excelUrl = await Preferences.get({ key: PREFERENCES_EXCEL_URL_KEY });
    
    return {
      jsonUrl: jsonUrl.value || null,
      excelUrl: excelUrl.value || null
    };
  } catch (error) {
    console.warn('Erro ao carregar URLs do Preferences:', error);
    return { jsonUrl: null, excelUrl: null };
  }
};

/**
 * Salva as URLs no Preferences (armazenamento persistente)
 * @param {string} jsonUrl 
 * @param {string} excelUrl 
 */
const saveUrlsToPreferences = async (jsonUrl, excelUrl) => {
  try {
    if (jsonUrl) {
      await Preferences.set({ key: PREFERENCES_JSON_URL_KEY, value: jsonUrl });
    }
    if (excelUrl) {
      await Preferences.set({ key: PREFERENCES_EXCEL_URL_KEY, value: excelUrl });
    }
    console.log('URLs salvas no Preferences com sucesso');
  } catch (error) {
    console.warn('Erro ao salvar URLs no Preferences:', error);
  }
};

/**
 * Obtém a URL do JSON a ser usada
 * Prioridade: ENV → Preferences
 * @returns {Promise<string|null>}
 */
export const getJsonUrl = async () => {
  // 1. Primeiro tenta da variável de ambiente
  if (ENV_JSON_URL) {
    console.log('Usando JSON_URL do ambiente');
    return ENV_JSON_URL;
  }
  
  // 2. Se não tem no ambiente, tenta do Preferences
  const prefs = await loadUrlsFromPreferences();
  if (prefs.jsonUrl) {
    console.log('Usando JSON_URL do Preferences (cache)');
    return prefs.jsonUrl;
  }
  
  // 3. Não encontrou em nenhum lugar
  console.warn('JSON_URL não encontrado em nenhum lugar');
  return null;
};

/**
 * Obtém a URL do Excel a ser usada
 * Prioridade: ENV → Preferences
 * @returns {Promise<string|null>}
 */
export const getExcelUrl = async () => {
  // 1. Primeiro tenta da variável de ambiente
  if (ENV_EXCEL_URL) {
    console.log('Usando EXCEL_URL do ambiente');
    return ENV_EXCEL_URL;
  }
  
  // 2. Se não tem no ambiente, tenta do Preferences
  const prefs = await loadUrlsFromPreferences();
  if (prefs.excelUrl) {
    console.log('Usando EXCEL_URL do Preferences (cache)');
    return prefs.excelUrl;
  }
  
  // 3. Não encontrou em nenhum lugar
  console.warn('EXCEL_URL não encontrado em nenhum lugar');
  return null;
};

/**
 * Salva as URLs no Preferences para uso futuro
 * Deve ser chamado quando as URLs forem obtidas com sucesso
 * @param {string} jsonUrl 
 * @param {string} excelUrl 
 */
export const saveUrls = async (jsonUrl, excelUrl) => {
  // Salva as URLs se pelo menos uma for válida
  if (jsonUrl || excelUrl) {
    await saveUrlsToPreferences(jsonUrl, excelUrl);
  }
};

/**
 * Parseia a resposta do Google Visualization API
 * O formato é: google.visualization.Query.setResponse({...})
 * @param {string} responseText - Texto bruto da resposta
 * @returns {Array} Array de objetos com os dados
 */
const parseGoogleVisualizationResponse = (responseText) => {
  // Remove o wrapper "google.visualization.Query.setResponse(" e o ");" final
  const jsonStart = responseText.indexOf('{');
  const jsonEnd = responseText.lastIndexOf('}');
  const jsonStr = responseText.slice(jsonStart, jsonEnd + 1);
  
  const data = JSON.parse(jsonStr);
  
  // Verifica se houve erro
  if (data.status === 'error') {
    throw new Error(data.errors?.[0]?.message || 'Erro ao carregar dados');
  }
  
  // Extrai as colunas (cabeçalhos)
  const columns = data.table.cols.map(col => col.label || col.id);
  
  // DEBUG: Log das colunas encontradas
  console.log('DEBUG - Colunas encontradas no JSON:', columns);
  console.log('DEBUG - Colunas que contêm "Marca" ou "Modelo":', columns.filter(c => 
    c.toLowerCase().includes('marca') || c.toLowerCase().includes('modelo')
  ));
  
  // Extrai as linhas e converte para objetos
  const rows = data.table.rows.map(row => {
    const obj = {};
    row.c.forEach((cell, index) => {
      const columnName = columns[index] || `coluna_${index}`;
      // O valor pode estar em cell.v (valor) ou cell.f (formatado)
      obj[columnName] = cell?.v ?? cell?.f ?? '';
    });
    return obj;
  });
  
  return rows;
};

/**
 * Carrega dados do Google Sheets em formato JSON (mais rápido)
 * @returns {Promise<Array>} Array de objetos com os dados
 */
export const loadFromGoogleSheetsJSON = async () => {
  const JSON_URL = await getJsonUrl();
  
  if (!JSON_URL) {
    throw new Error('URL do JSON não configurada');
  }
  
  console.log('Carregando dados via JSON (rápido)...');
  
  const response = await fetch(JSON_URL);
  
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }
  
  const text = await response.text();
  const data = parseGoogleVisualizationResponse(text);
  
  console.log('Dados carregados via JSON:', data.length, 'registros');
  
  // Salva as URLs para uso futuro (resiliência)
  const excelUrl = await getExcelUrl();
  await saveUrls(JSON_URL, excelUrl);
  
  return data;
};

/**
 * Carrega dados do Excel (fallback mais lento)
 * Usa a biblioteca xlsx para parsear
 * @param {Function} xlsxLib - Biblioteca XLSX importada
 * @returns {Promise<Array>} Array de objetos com os dados
 */
export const loadFromExcel = async (xlsxLib) => {
  const EXCEL_URL = await getExcelUrl();
  
  if (!EXCEL_URL) {
    throw new Error('URL do Excel não configurada');
  }
  
  console.log('Carregando dados via Excel (fallback)...');
  
  const response = await fetch(EXCEL_URL);
  
  if (!response.ok) {
    throw new Error(`Erro HTTP: ${response.status}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const workbook = xlsxLib.read(arrayBuffer, { type: 'array' });
  
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  const data = xlsxLib.utils.sheet_to_json(worksheet, {
    raw: false,
    defval: ''
  });
  
  console.log('Dados carregados via Excel:', data.length, 'registros');
  
  // Salva as URLs para uso futuro (resiliência)
  const jsonUrl = await getJsonUrl();
  await saveUrls(jsonUrl, EXCEL_URL);
  
  return data;
};

/**
 * Tenta carregar via JSON primeiro, se falhar usa Excel como fallback
 * @param {Function} xlsxLib - Biblioteca XLSX importada (para fallback)
 * @returns {Promise<{data: Array, source: string}>} Dados e fonte usada
 */
export const loadDataWithFallback = async (xlsxLib) => {
  try {
    // Tenta JSON primeiro (mais rápido)
    const data = await loadFromGoogleSheetsJSON();
    return { data, source: 'json' };
  } catch (jsonError) {
    console.warn('Falha ao carregar JSON, tentando Excel:', jsonError.message);
    
    // Fallback para Excel
    try {
      const data = await loadFromExcel(xlsxLib);
      return { data, source: 'excel' };
    } catch (excelError) {
      console.error('Falha também no Excel:', excelError.message);
      throw new Error('Não foi possível carregar os dados');
    }
  }
};
