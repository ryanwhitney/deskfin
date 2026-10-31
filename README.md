# deskfin

A desktop browser-focused frontend for [Jellyfin](https://jellyfin.org). Built as a fork of [jellyfin-web](https://github.com/jellyfin/jellyfin-web) and intended to maintain compatibility.

This replaces the most visible parts of jellyfin-web with a new interface. Deeper screens and controls (admin dashboard, metadata editing, etc.) still render from jellyfin-web, allowing this to be more tightly scoped to the things that matter and more maintainable.

Designed to be fast, pretty, and keyboard accessible. 

 ## Changes from jellyfin-web:
 
- New home, library, details, and playlist pages are completely replaced. Playback controls are partially replaced.
- Features keyboard-navigable cards and menus built on [React Aria](https://react-spectrum.adobe.com/react-aria/) instead of MUI
- Material icons are replaced and system fonts are used.
- Playlists (re-orderable) display as first-class sections on the home screen.
- New episode list/picker in playback controls.
- Faster load times and faster builds. rspack replaces webbpack. Bundles are smaller. No legacy polyfills.

Deskfin's own code lives in `src/apps/deskfin`, with as little crossover with upstream as possible.

## Requirements

- Node 24+ and npm 11+
- A recent Jellyfin server (developed against 12.4)

## Development

```sh
npm install
npm start
```

This starts a dev server at http://localhost:8080. On first load, enter your Jellyfin server's address.

`npm run build:check`, `npm run lint` and `npm test` run the type checker, linter and tests.

## Building

```sh
npm run build
```

The site is written to `dist/`.

## Deploying

The simplest setup is to have Jellyfin serve deskfin in place of its bundled web client:

```sh
jellyfin --webdir /path/to/deskfin/dist
```

You can also set `JELLYFIN_WEB_DIR`, or with Docker, mount `dist` over `/jellyfin/jellyfin-web`. Deskfin is then at `http://your-server:8096/web/` and connects to the server it's served from.

You can also host `dist/` on any static web server. To point new devices at your server, build with its address:

```sh
JELLYFIN_SERVERS=https://jellyfin.example.com npm run build
```

## Keeping up with upstream

```sh
git remote add upstream https://github.com/jellyfin/jellyfin-web.git
git fetch upstream && git merge upstream/master
npm run divergence   # lists files outside src/apps/deskfin that differ from upstream
```

## License

GPL-2.0-or-later, the same as jellyfin-web.
