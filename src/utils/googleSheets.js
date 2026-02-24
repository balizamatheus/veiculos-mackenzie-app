/**
 * Utilitário para carregar dados do Google Sheets em formato JSON
 * O Google Visualization API retorna um formato específico que precisa ser parseado
 */

// URL do JSON do Google Sheets
const JSON_URL = import.meta.env.VITE_JSON_URL;
const EXCEL_URL = import.meta.env.VITE_EXCEL_URL;

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
  return data;
};

/**
 * Carrega dados do Excel (fallback mais lento)
 * Usa a biblioteca xlsx para parsear
 * @param {Function} xlsxLib - Biblioteca XLSX importada
 * @returns {Promise<Array>} Array de objetos com os dados
 */
export const loadFromExcel = async (xlsxLib) => {
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
