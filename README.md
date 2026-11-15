# Battledeck Launcher

Interface web mobile-first criada a partir dos arquivos originais enviados: `index.html`, `style.css` e `script.js`.

## Executar

Abra `index.html` em um navegador para testar localmente. Para instalação como PWA e funcionamento offline, publique em HTTPS (por exemplo, GitHub Pages).

## Instalar no Android

1. Abra o endereço publicado no Chrome.
2. Abra o menu do navegador.
3. Escolha **Instalar app** ou **Adicionar à tela inicial**.

## Observação sobre Android nativo

O código original detecta uma ponte `window.Android` para alguns recursos nativos. No navegador/PWA, esses recursos dependem das APIs do navegador e permissões disponíveis. Para substituir o launcher padrão do Android, é necessário empacotar a interface em um aplicativo Android nativo com uma Activity configurada como HOME.


## Publicar no GitHub Pages (passo único)

O repositório ainda precisa ter o Pages ativado pelo proprietário. O GitHub Actions não consegue ativar essa configuração por conta própria neste repositório.

1. Abra **Settings** do repositório.
2. Entre em **Pages**.
3. Em **Build and deployment**, escolha **GitHub Actions** como fonte.
4. Volte à aba **Actions** e execute novamente **Deploy Battledeck to GitHub Pages** (ou faça um novo commit).

Depois que o deploy terminar com sucesso, o endereço será:
https://skbubblegun.github.io/Battledeck/

Se o workflow mostrar `Get Pages site failed: Not Found`, significa que o passo 3 ainda não foi concluído.


## Versão Android nativa

Também existe um projeto Android em `android/`. Ele usa a interface original dentro de uma WebView e implementa a ponte Android para listar, abrir e favoritar aplicativos instalados. O app declara a categoria **HOME**, então pode ser escolhido como tela inicial padrão do aparelho.

Para obter o APK de teste: abra **Actions** → **Build Battledeck Android APK** → selecione a execução concluída → baixe o artefato **Battledeck-Android-APK**. Instale o APK no Android e, em **Configurações → Aplicativos → Aplicativos padrão → App de início**, selecione **Battledeck**. Os nomes dos menus podem variar conforme o fabricante.
