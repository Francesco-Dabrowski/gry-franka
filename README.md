# Zbiórka Franka — Gry

Statyczna strona z grami w czystym HTML + JS. Otwierasz link i grasz — bez instalacji i bez serwera.

## Gry

| Gra | Plik |
|---|---|
| Saper | `js/games/minesweeper.js` |
| Pasjans (Klondyk) | `js/games/klondike.js` |
| Pasjans: Pająk | `js/games/spider.js` |
| Backrooms | `js/games/backrooms.js` |

Wygląd strony głównej utrzymany jest w stylu Windows 95/98 (okno, pasek zadań, menu Start, przyciski 3D). Ikony gier to pixel art z `js/core/icons.js`, a karty obsługuje wspólny moduł `js/core/cards.js`.

## Jak otworzyć

### Lokalnie
Kliknij dwukrotnie `index.html` albo w VS Code użyj „Open with Live Server”.

### Z linku (hosting)
Wrzuć cały katalog na darmowy hosting statyczny:

- **Netlify Drop** — wejdź na https://app.netlify.com/drop i przeciągnij folder projektu. Dostaniesz link typu `https://losowa-nazwa.netlify.app`.
- **GitHub Pages** — wrzuć pliki do repozytorium, potem Settings → Pages → Branch `main` / root. Link: `https://<user>.github.io/<repo>/`.
- **Cloudflare Pages / Vercel** — analogicznie, wystarczy wskazać katalog projektu.

Ważne, żeby plik `index.html` był w katalogu głównym — wtedy link otwiera menu gier.

## Struktura

```
index.html                  menu (generowane z registry)
css/style.css               wspólny wygląd
css/games.css               elementy gier
js/core/game.js             klasa bazowa Game (start/stop/pauza + overlay)
js/core/storage.js          rekordy w localStorage
js/core/registry.js         lista gier — menu generuje się z niej
js/games/*.js               implementacje gier
games/<gra>/index.html      strony gier
```

## Jak dodać nową grę solo

1. Dodaj wpis w `js/core/registry.js` (id, nazwa, ikonka, `type: 'solo'`, URL).
2. Stwórz `games/<id>/index.html` wzorując się na `games/saper/index.html`.
3. W `js/games/<id>.js` dziedzicz po `ZFG.Game`, zaimplementuj `init`, `_start`, `_stop` i logikę, na końcu zarejestruj klasę w `ZFG.games`.
4. Rekord zapiszesz przez `this.setScore(...)` i `this.saveBest()`.

## Gry online (wyłączone)

W repo zostały pliki `js/games/tictactoe.js`, `js/games/pong.js`, katalog `js/net/` oraz serwer `server/` z Socket.IO. Są odłączone od menu i nie są potrzebne do działania strony. Do ich włączenia trzeba postawić serwer (`cd server; npm install; npm start`) i dodać wpisy z `type: 'online'` do `js/core/registry.js`.
