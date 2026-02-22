import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Configuração - substitua pelo seu usuário/repositório
const GITHUB_REPO = 'balizamatheus/veiculos-mackenzie-app';

// Token de acesso pessoal do GitHub (permissões mínimas: apenas ler releases)
// IMPORTANTE: Crie seu token em https://github.com/settings/tokens
// Permissões necessárias: repo (para repositório privado)
const GITHUB_TOKEN = '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';

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
    // Buscar última release do GitHub com autenticação
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Veiculos-App'
      }
    });
    
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
        
        // Baixar o arquivo com autenticação
        const zipResponse = await fetch(zipAsset.url, {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/octet-stream',
            'User-Agent': 'Veiculos-App'
          }
        });
        
        if (!zipResponse.ok) {
          console.log(`Updater: Erro ao baixar ZIP: ${zipResponse.status}`);
          return;
        }
        
        // Converter para blob e depois para base64
        const blob = await zipResponse.blob();
        const base64 = await blobToBase64(blob);
        
        // Salvar arquivo temporariamente
        const fileName = `update-${latestVersion}.zip`;
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache
        });
        
        // Obter caminho do arquivo
        const fileUri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Cache
        });
        
        console.log(`Updater: Arquivo salvo em ${fileUri.uri}`);
        
        // Baixar e aplicar atualização usando o arquivo local
        const downloaded = await CapacitorUpdater.download({
          url: fileUri.uri,
          version: latestVersion
        });
        
        // Aplicar a atualização
        await CapacitorUpdater.set({ id: downloaded.id });
        
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
 * Converte Blob para Base64
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remover o prefixo "data:application/zip;base64,"
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Força verificação de atualização
 */
export async function checkForUpdate() {
  if (!Capacitor.isNativePlatform()) {
    return { available: false };
  }
  
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Veiculos-App'
      }
    });
    
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
