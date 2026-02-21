# Sistema de Atualizações Automáticas (GitHub Releases)

Este projeto está configurado com **Capacitor Updater** + **GitHub Releases** para permitir atualizações automáticas com repositório privado.

## Vantagens

- ✅ **Repositório privado** - Código e dados não ficam públicos
- ✅ **Atualização automática** - Usuários recebem atualizações sem novo APK
- ✅ **Gratuito** - GitHub Releases é gratuito para repositórios privados
- ✅ **Simples** - Basta fazer push e o GitHub cria a release automaticamente

## Configuração Inicial

### 1. Criar repositório privado no GitHub

1. Acesse https://github.com/new
2. Crie um repositório **privado** chamado `veiculos-app`
3. Anote seu nome de usuário do GitHub

### 2. Atualizar configuração

Edite os arquivos abaixo substituindo `SEU-USUARIO` pelo seu nome de usuário:

**[`capacitor.config.json`](capacitor.config.json):**
```json
"updateUrl": "https://api.github.com/repos/SEU-USUARIO/veiculos-app/releases/latest"
```

**[`src/utils/updater.js`](src/utils/updater.js):**
```javascript
const GITHUB_REPO = 'SEU-USUARIO/veiculos-app';
```

### 3. Subir o projeto para o GitHub

```bash
git init
git add .
git commit -m "Primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/veiculos-app.git
git push -u origin main
```

## Como Atualizar os Dados

### Método Automático (Recomendado)

1. **Atualize o arquivo** `public/dados.xlsx`
2. **Atualize a versão** no `package.json`:
   ```json
   "version": "1.0.1"  // Incremente a versão
   ```
3. **Faça commit e push:**
   ```bash
   git add .
   git commit -m "Atualizar dados para v1.0.1"
   git push
   ```

O **GitHub Actions** criará automaticamente uma Release com o arquivo de atualização!

### Método Manual

1. Faça o build: `npm run build`
2. Crie o ZIP: `cd dist && zip -r ../dist-v1.0.1.zip .`
3. Vá no GitHub → Releases → Draft a new release
4. Anexe o ZIP e publique

## Fluxo de Atualização

```
┌─────────────────────────────────────────────────────────────┐
│  Seu Computador                                              │
│                                                              │
│  1. Edita public/dados.xlsx                                 │
│  2. Atualiza versão no package.json                         │
│  3. git push                                                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  GitHub (Repositório Privado)                                │
│                                                              │
│  1. GitHub Actions faz build                                │
│  2. Cria ZIP do dist                                        │
│  3. Cria Release com o ZIP anexado                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Celular do Usuário                                          │
│                                                              │
│  1. App verifica última release no GitHub                   │
│  2. Compara versões                                         │
│  3. Se nova versão → baixa e aplica automaticamente         │
└─────────────────────────────────────────────────────────────┘
```

## Versionamento

A versão é definida no [`package.json`](package.json):

- `1.0.0` → `1.0.1` (pequenas correções/atualizações de dados)
- `1.0.0` → `1.1.0` (novas funcionalidades)
- `1.0.0` → `2.0.0` (mudanças grandes)

**Importante:** Sempre incremente a versão para que o app detecte a atualização!

## Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| [`src/utils/updater.js`](src/utils/updater.js) | Verifica e aplica atualizações |
| [`.github/workflows/create-release.yml`](.github/workflows/create-release.yml) | Cria releases automaticamente |
| [`capacitor.config.json`](capacitor.config.json) | Configuração do updater |

## Testando

1. Instale o APK no celular
2. Faça uma alteração no `dados.xlsx`
3. Incremente a versão no `package.json`
4. Faça push para o GitHub
5. Aguarde o GitHub Actions criar a release
6. Abra o app no celular - ele deve atualizar automaticamente

## Troubleshooting

### Atualização não funciona

1. Verifique se o `GITHUB_REPO` em [`src/utils/updater.js`](src/utils/updater.js) está correto
2. Verifique se a release foi criada no GitHub
3. Verifique se a versão da release é maior que a do app

### Erro de download

- Verifique se o arquivo ZIP está anexado à release
- Verifique se o repositório é acessível

### App não verifica atualizações

- Verifique se o `initUpdater()` está sendo chamado no [`src/App.jsx`](src/App.jsx)
- Verifique se o dispositivo tem conexão com internet

## Segurança

- O repositório é **privado**, então o código não é público
- As releases são acessíveis, mas requerem conhecimento do repositório
- Para maior segurança, considere adicionar autenticação no futuro
