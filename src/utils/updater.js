import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

// Configuração do Capacitor Updater
const GITHUB_REPO = 'balizamatheus/veiculos-mackenzie-app';

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
        
        // Importante: Notificar que o app carregou com sucesso
        // Sem isso, o CapacitorUpdater faz rollback automático
        await CapacitorUpdater.notifyAppReady();
        
        console.log('Updater: Atualização aplicada com sucesso');
      } else {
        console.log('Updater: Nenhum arquivo ZIP encontrado na release');
      }
    } else {
      console.log('Updater: App já está na versão mais recente');
      // Notificar que o app carregou com sucesso (importante para evitar rollback)
      await CapacitorUpdater.notifyAppReady();
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
 */
async function getCurrentVersion() {
  try {
    const current = await CapacitorUpdater.current();
    return current.version || '1.0.0';
  } catch {
    return '1.0.0';
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
