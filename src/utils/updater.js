import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

// Versão do app (deve bater com App.jsx)
import { APP_VERSION } from '../App';

// Configuração do Capacitor Updater
const GITHUB_REPO = 'balizamatheus/veiculos-mackenzie-app';

// URLs do ambiente (embutidas no APK)
const ENV_JSON_URL = import.meta.env.VITE_JSON_URL;
const ENV_EXCEL_URL = import.meta.env.VITE_EXCEL_URL;

/**
 * Salva as URLs do .env no Preferences ANTES de qualquer update
 * Isso garante que após o update, o app ainda terá acesso às URLs
 */

/**
 * Verifica e aplica atualizações automaticamente
     * Deve ser chamado no início do app
 */
export async function initUpdater() {
  // Só funciona em apps nativos (Android/iOS)
  if (!Capacitor.isNativePlatform()) {
    console.log('Updater: Rodando em navegador, pulando verificação de atualização');
    return;
  }

  // ========== NOVO: Salvar URLs ANTES do update ==========
  try {
    // Also save the current version if not already saved
    const savedVersion = await Preferences.get({ key: 'app_version' });
    if (!savedVersion.value) {
      await Preferences.set({ key: 'app_version', value: APP_VERSION });
      console.log('Updater: Versão inicial salva no Preferences:', APP_VERSION);
    }
    
    if (ENV_JSON_URL || ENV_EXCEL_URL) {
      console.log('Updater: Salvando URLs do .env no Preferences...');
      
      // Verificar se já estão salvas para evitar writing desnecessário
      const savedJson = await Preferences.get({ key: 'config_json_url' });
      const savedExcel = await Preferences.get({ key: 'config_excel_url' });
      
      if (!savedJson.value || savedJson.value !== ENV_JSON_URL) {
        await Preferences.set({ key: 'config_json_url', value: ENV_JSON_URL || '' });
        console.log('Updater: JSON_URL salva no Preferences');
      }
      
      if (!savedExcel.value || savedExcel.value !== ENV_EXCEL_URL) {
        await Preferences.set({ key: 'config_excel_url', value: ENV_EXCEL_URL || '' });
        console.log('Updater: EXCEL_URL salva no Preferences');
      }
      
      console.log('Updater: URLs do .env salvas no Preferences com sucesso');
    } else {
      console.log('Updater: Nenhuma URL encontrada no .env');
    }
  } catch (error) {
    console.warn('Updater: Erro ao salvar URLs no Preferences:', error);
  }
  // =========================================================

  // IMPORTANTE: Notificar que o app carregou com sucesso IMEDIATAMENTE
  // Isso deve ser chamado antes de qualquer operação assíncrona
  try {
    await CapacitorUpdater.notifyAppReady();
    console.log('Updater: notifyAppReady chamado com sucesso');
  } catch (error) {
    console.error('Updater: Erro ao chamar notifyAppReady', error);
  }

  try {
    // Buscar última release do GitHub (repositório público)
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    
    if (!response.ok) {
      console.log(`Updater: Erro ao buscar release: ${response.status}`);
      return;
    }
    
    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '');
    
    // Verificar versão atual
    const currentVersion = await getCurrentVersion();
    
    console.log(`Updater: Versão atual: ${currentVersion}, Versão disponível: ${latestVersion}`);
    
    if (isNewerVersion(latestVersion, currentVersion)) {
      console.log(`Updater: Nova versão ${latestVersion} disponível`);
      
      // Encontrar o arquivo ZIP da release
      const zipAsset = release.assets.find(asset => asset.name.endsWith('.zip'));
      
      if (zipAsset) {
        console.log(`Updater: Baixando ${zipAsset.name}...`);
        
        // Baixar e aplicar atualização
        const downloaded = await CapacitorUpdater.download({
          url: zipAsset.browser_download_url,
          version: latestVersion
        });
        
        // Aplicar a atualização
        await CapacitorUpdater.set({ id: downloaded.id });
        
        // Salvar a versão no Preferences para evitar loop
        await saveCurrentVersion(latestVersion);
        
        console.log('Updater: Atualização aplicada com sucesso');
      } else {
        console.log('Updater: Nenhum arquivo ZIP encontrado na release');
      }
    } else {
      console.log('Updater: App já está na versão mais recente');
    }
  } catch (error) {
    console.error('Updater: Erro ao verificar atualização', error);
  }
}

/**
 * Força verificação de atualização
 */
export async function checkForUpdate() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false };
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    
    if (!response.ok) {
      return { available: false };
    }
    
    const release = await response.json();
    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = await getCurrentVersion();
    
    return {
      available: isNewerVersion(latestVersion, currentVersion),
      version: latestVersion,
      url: release.html_url
    };
  } catch (error) {
    console.error('Updater: Erro ao verificar atualização', error);
    return { available: false };
  }
}

/**
 * Obtém versão atual do app
 * Agora lê do Preferences (onde salvamos após cada update)
 * Isso evita o loop infinito de atualizações
 */
async function getCurrentVersion() {
  try {
    // Primeiro tenta ler do Preferences (versão salva do último update)
    const savedVersion = await Preferences.get({ key: 'app_version' });
    if (savedVersion.value) {
      console.log('Updater: Versão lida do Preferences:', savedVersion.value);
      return savedVersion.value;
    }
    
    // Se não tem no Preferences, usa a versão do APP_VERSION
    console.log('Updater: Nenhuma versão salva no Preferences, usando APP_VERSION');
    return APP_VERSION;
  } catch {
    return APP_VERSION;
  }
}

/**
 * Salva a versão atual no Preferences
 * Chamado após aplicar uma atualização
 */
async function saveCurrentVersion(version) {
  try {
    await Preferences.set({ key: 'app_version', value: version });
    console.log('Updater: Versão salva no Preferences:', version);
  } catch (error) {
    console.warn('Updater: Erro ao salvar versão:', error);
  }
}

/**
 * Compara versões (retorna true se a for maior que b)
 */
function isNewerVersion(a, b) {
  const parseVersion = (v) => v.split('.').map(Number);
  const aParts = parseVersion(a);
  const bParts = parseVersion(b);
  
  for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    
    if (aVal > bVal) return true;
    if (aVal < bVal) return false;
  }
  
  return false;
}
