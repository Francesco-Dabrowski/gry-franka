# Historia zmian

Wszystkie istotne zmiany w projekcie. Format: data — opis.

## 2026-09-20

### Backrooms — konkretna struktura zamiast losowości
- Wdrożony wzór użytkownika „Przykład — filary" (15×15: ściany `1`, podłoga `0`, dziury `x` — regularna siatka studni) jako **jedyna** struktura w świecie.
- 1 znak wzoru = blok 3×3 kafle, wzór powtarza się globalnie (periodycznie) i bez szwów na granicach chunków.
- Przestrzeń między strukturami (znak `.`) jest podłogą; usunięte losowe przejścia i carving, które psuły wzór.
- Ścieżki między filarami są przechodnie, więc świat pozostaje grywalny.
- Zasięg widzenia zwiększony 3× (`MAXDIST 26 → 78`), więcej stopni cieniowania (`LEVELS 32 → 40`), ładowanie chunków poszerzone (`LOAD_RADIUS 2 → 6`).

### Edytor struktur (nowy program w menu)
- Program „Edytor struktur" w menu gier: biała siatka na czarnych pikselach, każdy piksel = pole 3×3 małe tile.
- Malu­nie jak w starym Paintcie: kolory oznaczają typ — ciemnobeżowy = ściana (`1`), jasnobeżowy = podłoga (`0`), granatowy = dziura (`x`), czarny = puste (poza strukturą, `.`).
- Narzędzia: Ołówek, Wypełnij (flood fill), Gumka; prawy przycisk = gumka.
- Katalog struktur: nowa, zmiana nazwy, duplikowanie, usuwanie; zapis w `localStorage`.
- **Rozmiar struktury**: pola „kolumny × wiersze" (w tile'ach) ustawiają wymiary segmentu do malowania (zachowując istniejącą zawartość); skalowanie widoku realizuje Zoom.
- Powiększanie/pomniejszanie mapy: przyciski − / + / Reset, `Ctrl` + kółko myszy, skróty `+`/`-`/`0`. Poziom zoomu pokazywany w procentach i zapisywany.
- Parametry struktury 1–10: **rzadkość** (1 = bardzo bardzo rzadka, 10 = bardzo częsta) oraz **powtarzalność** (1 = 1–10 powtórzeń, 10 = 100–500+; w linii lub na powierzchni). Wartości zapisywane i dołączane do kodu/JSON struktury.
- Każda struktura generuje kod (`ZFG-STRUKTURA v1`, znaki `. 0 1 x`) oraz JSON do skopiowania — do późniejszego przetworzenia na realne struktury Backrooms.

### Backrooms — kamera (pitch), 3D otchłań, wolniejsza stamina, system wzorów
- Rozglądanie w pionie: **strzałki w górę/w dół** oraz **mysz w pionie** (y-shear rzutowania; pitch ograniczony).
- Nieskończona otchłań renderowana w 3D — spadanie to prawdziwy zjazd kamery w dół szybu (4 ściany w perspektywie, głębokość 44), zamiast ekranowej animacji 2D.
- Stamina zużywa się wolniej (`16/s` zamiast `26/s`), regeneracja szybsza.
- Nowy system wzorów zamiast losowych struktur: wzory to rzut z góry, gdzie `0` = podłoga, `1` = ściana, `x` = dziura w dół. Wzory są nazwane, mają wagę i są kafelkowane na chunk; przejścia między chunkami są gwarantowane. Na razie wbudowany wzór `filary-2x2` (do podmiany na wzory użytkownika).

### Backrooms — kolory, prawdziwe 3D schody, pokoje jak na zdjęciach
- Ujednolicona paleta bez szarych bloków: podłoga, ściany, sufit, filary i wnętrza dziur w ciepłej żółto-beżowej tonacji. Usunięte czerwone warianty podłogi i szare linie.
- Schody renderowane jako prawdziwa geometria 3D: stopnie, podstopnie i ściany szybu rzutowane z buforem głębi. Są widoczne od razu, z każdej odległości i kąta. Wejście na schody to płynne przejście (zaciemnienie) i ekran wygranej.
- Dziury w podłodze renderowane jako 3D szyby z bocznymi ścianami; nadal nieskończenie głębokie (spadek = przegrana po 30 kaflach).
- Pokoje wzorowane na zdjęciach: hale z siatką filarów (rzadką i gęstą), długie korytarze, labirynt pokoi z przejściami, sala z dziurami oraz rzadkie wielkie hale.

### Backrooms — duże poprawki silnika
- Wysokość ścian zmieniona na **5 kafli** (`WALL_TILES_H = 5`).
- Usunięte linie na kafelkach ścian: cienkie paski, szwy co kafel oraz pasy diagonalne; została gładka, lekko marmurkowata faktura.
- Nowe, matowe oświetlenie: lampy sufitowe dają miękkie, realistyczne plamy światła na podłodze, suficie i ścianach (bez połysku/specularu). Podniesiony ambient.
- Zwiększona widoczność: zasięg rysowania `MAXDIST 15 → 26`, więcej poziomów cieniowania `24 → 32`.
- Powtarzalne motywy pokoi w dzielnicach 4×4 chunki: otwarte sale, hala z kolumnami, siatka korytarzy, drobne pokoje, sala z dziurami oraz rzadkie wielkie sale. Generacja deterministyczna per świat.
- Dziury w podłodze są nieskończenie głębokie: wejście uruchamia spadanie, a po **30 kaflach** pokazuje się ekran przegranej.
- Schody renderowane w świecie jako wgłębienie ze stopniami (widoczne od razu, nie po wejściu).

### Nowe gry solo (zamiana poprzednich)
- Dodane: **Saper** (`js/games/minesweeper.js`), **Pasjans / Klondyk** (`js/games/klondike.js`), **Pasjans: Pająk** (`js/games/spider.js`).
- Wspólny moduł kart: `js/core/cards.js`.
- Usunięte stare gry: Wężyk (`snake.js`) i Memory (`memory.js`).
- Nowe ikony pixel art: `mine`, `solitaire`, `spider`.

### Strona
- Wygląd w stylu Windows 95/98: pulpit, okno z paskiem tytułu, menu Start, pasek zadań, przyciski 3D.
- Ikony gier jako pixel art (`js/core/icons.js`) zamiast emoji.
- Kliknięcie gry na stronie głównej uruchamia ją od razu (auto-start), bez dodatkowych kliknięć.

## Wcześniej
- Początkowa wersja: statyczna strona z menu gier (Snake, Memory), wspólna klasa `Game`, moduł `registry`, rekordy w `localStorage`.
- Dodany tryb gier online (Socket.IO, pokoje) — obecnie wyłączony z menu.
