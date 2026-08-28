# Moumusic

[简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Русский](README.ru.md) · [Español](README.es.md) · [Português](README.pt.md)

Moumusic es un reproductor de música ligero creado por moumou para el navegador y iOS. Permite buscar y reproducir música, guardar favoritos, ver letras, gestionar listas y descargar canciones sin necesidad de una cuenta.

## Funciones

- Cambia entre fuentes instaladas como NetEase Cloud Music, QQ Music, Kuwo y Luoxue desde la pantalla principal.
- Importa fuentes compatibles con LX Music / MusicFree desde «Ajustes». Las fuentes de terceros no vienen incluidas en la aplicación.
- Elige calidades de 128, 192, 320, 740 y 999 kbps según lo que ofrezca la fuente seleccionada.
- Usa análisis de letras, letras a pantalla completa, favoritos, importación y exportación de listas, descargas y sincronización de fuentes entre dispositivos.
- Consulta listas oficiales, como las canciones populares de NetEase Cloud Music, cuando la fuente instalada las proporciona.

## Reproducción en iOS

La aplicación nativa para iOS ofrece reproducción en segundo plano y muestra carátula, título, artista, álbum, progreso y controles en la pantalla bloqueada y el Centro de control. Las letras a pantalla completa y Live Activity / Dynamic Island muestran la línea actual. iOS no permite que una aplicación de terceros añada un campo de letras personalizado a la tarjeta multimedia del Centro de control.

## Fuentes

El proyecto está separado de sus fuentes musicales y no incluye archivos de fuentes en el repositorio ni en el IPA. Abre «Ajustes» y pega la URL de una fuente para instalarla. Se admiten métodos y campos habituales de LX Music / MusicFree, como `search`, `getMediaSource`, `getLyric`, `name`, `singer`, `pic` e `interval`.

## Desarrollo local

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

## IPA de iOS sin firmar

La compilación de iOS requiere macOS 26 y Xcode 26:

```bash
pnpm build:ipa
# → ios/build/unsigned/Moumusic-unsigned.ipa
```

Un IPA sin firmar no se puede instalar directamente en un iPhone. Fírmalo primero con un certificado de desarrollo de Apple y un provisioning profile.

## Lanzamiento

Versión estable actual: [Moumusic v1.10.16](https://github.com/jiajia2222/moumusic-ios/releases/tag/v1.10.16).
