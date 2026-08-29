# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic é um reprodutor de música leve criado por moumou para navegador e iOS. Ele oferece pesquisa, reprodução, favoritos, letras, playlists e downloads sem exigir uma conta.

## Recursos

- Alterne entre fontes instaladas, como NetEase Cloud Music, QQ Music, Kuwo e Luoxue, na tela inicial.
- Importe fontes compatíveis com LX Music / MusicFree em “Configurações”. Fontes de terceiros não são incluídas no aplicativo.
- Escolha qualidades de 128, 192, 320, 740 e 999 kbps, conforme o que a fonte selecionada disponibilizar.
- Use análise de letras, letras em tela cheia, favoritos, importação e exportação de playlists, downloads e sincronização de fontes entre dispositivos.
- Veja rankings oficiais, como as músicas populares do NetEase Cloud Music, quando a fonte instalada os fornecer.

## Reprodução no iOS

O aplicativo nativo para iOS oferece reprodução em segundo plano e mostra capa, título, artista, álbum, progresso e controles na tela bloqueada e na Central de Controle. As letras em tela cheia e o Live Activity / Dynamic Island mostram a linha atual. O iOS não permite que apps de terceiros adicionem um campo de letras personalizado ao cartão de mídia da Central de Controle.

## Fontes

O projeto é separado das fontes de música e não inclui arquivos de fontes no repositório nem no IPA. Abra “Configurações” e cole a URL de uma fonte para instalá-la. São aceitos métodos e campos comuns do LX Music / MusicFree, como `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic` e `interval`.

## Desenvolvimento local

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## IPA do iOS sem assinatura

A compilação do iOS exige macOS 26 e Xcode 26:

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

Um IPA sem assinatura não pode ser instalado diretamente em um iPhone. Assine-o primeiro com um certificado de desenvolvimento da Apple e um provisioning profile.

## Lançamento

Versão estável atual: [Moumusic v1.10.17](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.17).
