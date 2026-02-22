# Sistema de Atualizações Automáticas

Este projeto está configurado com:
- **Capacitor Updater** para atualizações automáticas do app
- **Google Drive** para hospedar os dados do Excel (protegidos)
- **Repositório público** para permitir atualizações sem CORS

## Como Funciona

```
┌─────────────────────────────────────────────────────────────┐
│  GitHub (Repositório Público)                                │
│  - Código do app                                             │
│  - SEM o arquivo .env                                        │
│  - SEM o dados.xlsx                                          │
│  - Atualizações automáticas funcionam                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Seu Computador                                              │
│  - Arquivo .env com link do Google Drive                    │
│  - Não é enviado para o GitHub (está no .gitignore)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  APK Gerado                                                  │
│  - Contém o link do Google Drive embutido                   │
│  - Quem tem o APK consegue acessar os dados                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Google Drive                                                │
│  - Arquivo dados.xlsx                                        │
│  - Acessível pelo link                                       │
│  - Você atualiza quando quiser                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Configuração Inicial

### 1. Configurar Google Drive

1. Faça upload do arquivo `dados.xlsx` no Google Drive
2. Clique com botão direito → **Compartilhar**
3. Clique em **"Mudar para qualquer pessoa com o link"**
4. Copie o link (será algo como: `https://drive.google.com/file/d/XXXXX/view`)
5. Extraia o ID do arquivo (o `XXXXX` na URL)
6. A URL para download direto será:
   ```
   https://drive.google.com/uc?export=download&id=SEU_FILE_ID
   ```

### 2. Criar arquivo .env

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_EXCEL_URL=https://drive.google.com/uc?export=download&id=SEU_FILE_ID
```

### 3. Remover dados.xlsx do repositório

```bash
git rm public/dados.xlsx
git commit -m "Remover dados.xlsx - agora usa Google Drive"
```

### 4. Tornar repositório público

1. Acesse as configurações do repositório no GitHub
2. "Danger Zone" → "Change visibility" → "Make public"

### 5. Build e gerar APK

```bash
npm run android
```

Depois gere o APK no Android Studio.

---

## Como Atualizar os Dados

### Atualizar dados do Excel:

1. Edite o arquivo `dados.xlsx` no seu computador
2. Faça upload da nova versão no Google Drive (substitua o arquivo)
3. Pronto! Os usuários terão os dados atualizados na próxima abertura do app

### Atualizar o app (código, design, etc.):

1. Faça as alterações no código
2. Incremente a versão no `package.json`
3. Commit e push para o GitHub
4. O GitHub Actions criará uma release automaticamente
5. Os usuários receberão a atualização automaticamente

---

## Segurança

### O que está protegido:
- ✅ Link do Google Drive não fica no GitHub
- ✅ Dados não são indexados por buscadores
- ✅ Só quem tem o APK consegue acessar (indiretamente)

### Limitações:
- ⚠️ O link fica embutido no APK
- ⚠️ Alguém com conhecimento técnico pode extrair o link

---

## Arquivos Importantes

| Arquivo | Descrição |
|---------|-----------|
| [`.env.example`](.env.example) | Modelo do arquivo de ambiente |
| [`.gitignore`](.gitignore) | Garante que .env não vai para o GitHub |
| [`src/App.jsx`](src/App.jsx) | Carrega dados da URL configurada |
| [`src/utils/updater.js`](src/utils/updater.js) | Sistema de atualização automática |

---

## Troubleshooting

### Dados não carregam
- Verifique se o link do Google Drive está correto
- Verifique se o arquivo está compartilhado como "Qualquer pessoa com o link"
- Verifique os logs no console

### Atualização do app não funciona
- Verifique se o repositório é público
- Verifique se a release foi criada no GitHub
- Verifique os logs no Logcat filtrando por "Updater"
