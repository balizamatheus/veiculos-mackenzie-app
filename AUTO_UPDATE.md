# Sistema de Atualizações Automáticas (Repositório Privado)

Este projeto está configurado com **Capacitor Updater** + **GitHub Releases** + **Personal Access Token** para permitir atualizações automáticas com repositório privado.

## Configuração do Token

### 1. Criar Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note:** `Veiculos App Updater`
   - **Expiration:** `No expiration` (ou o tempo que preferir)
   - **Scopes:** Marque apenas `repo` (para repositório privado)
4. Clique em **"Generate token"**
5. **COPIE O TOKEN** (só aparece uma vez!)

### 2. Adicionar o Token no Código

Edite o arquivo [`src/utils/updater.js`](src/utils/updater.js) e substitua `SEU_TOKEN_AQUI` pelo seu token:

```javascript
const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
```

### 3. Build e Deploy

```bash
npm run android
```

Depois gere o APK no Android Studio.

---

## Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│  App no Celular                                              │
│                                                              │
│  1. Faz requisição para GitHub API                          │
│  2. Inclui token de autenticação                            │
│  3. GitHub retorna dados da release                         │
│  4. App baixa e aplica atualização                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Segurança

### O que o token permite:
- ✅ Ler releases do repositório
- ✅ Baixar arquivos das releases

### O que o token NÃO permite:
- ❌ Modificar código
- ❌ Criar releases
- ❌ Alterar configurações

### Aviso importante:
O token fica embutido no APK. Qualquer pessoa com conhecimento técnico pode extrair o token do APK. Isso oferece proteção contra acesso casual, mas não contra atacantes determinados.

---

## Fluxo de Atualização

### Quando você quiser atualizar:

1. **Atualize o arquivo** `public/dados.xlsx`
2. **Atualize a versão** no `package.json`:
   ```json
   "version": "1.0.3"  // Incremente a versão
   ```
3. **Faça commit e push:**
   ```bash
   git add .
   git commit -m "Atualizar dados para v1.0.3"
   git push
   ```

4. O GitHub Actions criará automaticamente uma Release
5. Os usuários receberão a atualização automaticamente

---

## Troubleshooting

### Erro 401 (Unauthorized)
- Verifique se o token está correto
- Verifique se o token tem permissão `repo`

### Erro 404 (Not Found)
- Verifique se o nome do repositório está correto
- Verifique se a release existe

### App não atualiza
- Verifique os logs no Logcat (filtre por "Updater")
- Verifique se a versão da release é maior que a do app

---

## Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| [`src/utils/updater.js`](src/utils/updater.js) | Código de atualização com token |
| [`.github/workflows/create-release.yml`](.github/workflows/create-release.yml) | Cria releases automaticamente |
| [`capacitor.config.json`](capacitor.config.json) | Configuração do Capacitor |
