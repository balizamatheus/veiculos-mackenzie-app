# Como Gerar o APK Android

Este projeto está configurado com **Capacitor** para transformar a aplicação React/Vite em um app Android nativo.

## Pré-requisitos

1. **Android Studio** instalado (versão mais recente recomendada)
   - Download: https://developer.android.com/studio

2. **Java JDK 17+** instalado
   - Verifique: `java -version`

3. **Android SDK** configurado
   - Instalado via Android Studio
   - Variável de ambiente `ANDROID_HOME` configurada

4. **Gradle** (já incluído no projeto Android)

## Scripts Disponíveis

```bash
# Desenvolvimento web
npm run dev

# Build para produção
npm run build

# Sincronizar arquivos web com o projeto Android
npm run cap:sync

# Abrir projeto no Android Studio
npm run cap:open

# Build completo + sincronização Android
npm run android
```

## Passo a Passo para Gerar o APK

### 1. Fazer Build e Sincronizar

```bash
npm run android
```

Este comando:
- Compila o projeto React/Vite
- Sincroniza os arquivos com o projeto Android

### 2. Abrir no Android Studio

```bash
npm run cap:open
```

Ou abra manualmente a pasta `android/` no Android Studio.

### 3. Gerar APK de Debug

No Android Studio:
1. Menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. O APK será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Gerar APK de Release (Assinado)

No Android Studio:
1. Menu **Build** → **Generate Signed Bundle / APK**
2. Selecione **APK**
3. Crie ou use uma keystore existente
4. Selecione o build variant **release**
5. O APK será gerado em: `android/app/build/outputs/apk/release/app-release.apk`

## Via Linha de Comando

### APK de Debug

```bash
cd android
./gradlew assembleDebug
```

O APK estará em: `android/app/build/outputs/apk/debug/app-debug.apk`

### APK de Release

```bash
cd android
./gradlew assembleRelease
```

O APK estará em: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

> **Nota:** Para release assinado, configure o arquivo `android/app/build.gradle` com as credenciais da keystore.

## Instalar APK no Celular

1. Transfira o APK para o celular (USB, email, etc.)
2. No celular, abra o arquivo APK
3. Permita instalação de fontes desconhecidas se solicitado
4. Instale o app

## Workflow de Desenvolvimento

1. Faça alterações no código React
2. Execute `npm run android` para sincronizar
3. Teste no Android Studio ou diretamente no celular

## Estrutura de Arquivos

```
├── android/              # Projeto Android nativo
│   ├── app/              # Código do app
│   └── build.gradle      # Configuração Gradle
├── dist/                 # Build web (gerado pelo Vite)
├── capacitor.config.json # Configuração do Capacitor
└── src/                  # Código fonte React
```

## Dicas

- **Ícone do App**: Substitua os ícones em `android/app/src/main/res/` (pastas mipmap-*)
- **Nome do App**: Edite `android/app/src/main/res/values/strings.xml`
- **Permissões**: Edite `android/app/src/main/AndroidManifest.xml`
- **Versão**: Edite `android/app/build.gradle` (versionCode e versionName)

## Solução de Problemas

### Erro de SDK não encontrado
```bash
# Configure ANDROID_HOME (Windows)
setx ANDROID_HOME "C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk"
```

### Erro de Gradle
```bash
cd android
./gradlew clean
```

### Sincronização não atualiza
```bash
npx cap sync android --deployment
```
