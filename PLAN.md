# Plan strony z grami

## Cel
Portal z grami w czystym HTML + JS: proste gry grywalne od razu w przeglądarce oraz gry online w pokojach (wiele urządzeń naraz).

## Architektura

```
┌──────────────────────────────────────────────┐
│  Strona główna (menu gier)                   │
├──────────────────────────────────────────────┤
│  Gry pojedyncze  →  czysty statyczny JS      │
│  (snake, tetris, memory...)                  │
│                                              │
│  Gry online      →  WebSockets               │
│  (pokoje: kod 4-cyfrowy, lobby, gra)         │
└──────────────────────────────────────────────┘
```

**Kluczowa decyzja:** gry multiplayer wymagają małego serwera (Node.js + Socket.IO) do przekazywania stanu między urządzeniami. Statyczny hosting (GitHub Pages) wystarczy tylko dla gier solo — dlatego planowane są dwa tryby hostingu:
1. **Frontend**: Netlify/GitHub Pages (darmowy)
2. **Serwer gier**: Render/Railway (darmowy plan) — wspólny kod hostowany w jednym repo

## Struktura projektu

```
Zbiorka_Franka/
├── index.html              # menu z listą gier
├── css/
│   ├── style.css           # wspólny wygląd
│   └── games.css
├── js/
│   ├── games/              # każda gra = osobny plik
│   │   ├── snake.js
│   │   └── ...
│   ├── net/
│   │   ├── socket.js       # wrapper WebSocketów
│   │   └── room.js         # tworzenie/dołączanie do pokoju
│   └── core/
│       ├── game.js         # klasa bazowa Game (start/stop/pauza)
│       └── registry.js     # lista gier — menu generuje się z niej
├── games/
│   ├── snake/index.html
│   └── [gra-online]/index.html
├── server/
│   ├── index.js            # Node.js + Socket.IO
│   └── rooms.js            # logika pokoi
└── README.md
```

## Jak dodać nową grę
1. Nowy katalog `games/nazwa/` + wpis w `js/core/registry.js` (nazwa, ikonka, typ: solo/online, URL).
2. Gra solo: dowolny kod, rejestruje się przez wspólną klasę `Game`.
3. Gra online: korzysta z `room.js` (kod pokoju, lobby, eventy `join/leave/state`) — serwer tylko przekazuje wiadomości, logika gry liczy się u graczy (jeden gracz-host jest autorytetem).

## System pokoi online
- **Host klika „Utwórz pokój"** → dostaje 4-cyfrowy kod (np. `4832`).
- **Inni wpisują kod** → dołączają do lobby (lista graczy na ekranie).
- **Host startuje** → wszyscy przechodzą do gry.
- Serwer (Socket.IO) prowadzi mapę `kod → pokój`, broadcastuje stan, pilnuje kto jest hostem.

## Etapy realizacji

| Etap | Co | Efekt |
|---|---|---|
| 1 | Szkielet: menu, style, klasa `Game`, registry | Pusta strona z listą |
| 2 | Pierwsza gra solo (np. Snake) | Wzorzec dla kolejnych |
| 3 | Serwer Node + Socket.IO, system pokoi | Lobby działa |
| 4 | Pierwsza gra online (np. kółko-krzyżyk lub „odbijanie piłki") | Multiplayer działa |
| 5 | Hosting (Netlify + Render) | Dostępna online |
| 6 | Dodawanie kolejnych gier | — |

## Przyszłe rozszerzenia
- Rekordy solo w `localStorage` (bez backendu)
- Później: konta + ranking w bazie (np. Supabase — pasuje do podejścia bez własnego backendu)
- QR-kod do szybkiego dołączania do pokoju z telefonu
