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
