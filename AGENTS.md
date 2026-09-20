# Zasady pracy z tym projektem

## Workflow (ważne)
Po **każdym** poleceniu dotyczącym poprawek strony:
1. Wprowadź zmiany w plikach.
2. Od razu otwórz stronę główną w domyślnej przeglądarce, bez pytania:

```powershell
Start-Process "C:\Users\admin\OneDrive\Dokumenty\Zbiorka_Franka\index.html"
```

Jeśli strona była już otwarta, i tak uruchom ponownie (użytkownik odświeży Ctrl+F5).

3. Dopisz zmiany do `CHANGELOG.md` i zrób commit w Git. Git jest przenośny (brak instalacji systemowej):

```powershell
& "C:\Users\admin\AppData\Local\Temp\opencode\PortableGit\cmd\git.exe" -C "C:\Users\admin\OneDrive\Dokumenty\Zbiorka_Franka" add -A
& "C:\Users\admin\AppData\Local\Temp\opencode\PortableGit\cmd\git.exe" -C "C:\Users\admin\OneDrive\Dokumenty\Zbiorka_Franka" commit -m "opis zmiany"
& "C:\Users\admin\AppData\Local\Temp\opencode\PortableGit\cmd\git.exe" -C "C:\Users\admin\OneDrive\Dokumenty\Zbiorka_Franka" push
```

Jeśli repozytorium nie ma jeszcze zdalnego `origin`, najpierw je dodaj/dopytać użytkownika o URL.

## Projekt
- Statyczna strona z grami: czysty HTML + CSS + JS (klasyczne skrypty, bez modułów ES).
- Brak serwera — otwiera się z pliku / linku statycznego hostingu (np. Netlify Drop).
- Na tej maszynie **nie ma Node.js ani Pythona**.
- Gry solo: Saper (`js/games/minesweeper.js`), Pasjans/Klondyk (`js/games/klondike.js`), Pasjans: Pająk (`js/games/spider.js`), Backrooms (`js/games/backrooms.js`).
- Karty obsługuje wspólny moduł `js/core/cards.js`.
- Backrooms to raycaster 2.5D w `js/games/backrooms.js` (canvas 320×240, tekstury generowane proceduralnie). Ściany mają wysokość 5 kafli, w podłodze są dziury (spadek = przegrana po 30 kafelkach) i motywy pokoi powtarzają się w dzielnicach 4×4 chunki.
- Narzędzia (za hasłem `@#$`): Edytor struktur (`games/edytor/`, `js/apps/editor.js`) i Wczytywanie struktur (`games/struktury/`, `js/apps/structures.js`); wspólny magazyn `localStorage` klucz `zfg.backrooms.structures.v1`.
- Backrooms generuje struktury wyłącznie z tego magazynu; brak struktur = sam świat z podłogi. 1 znak struktury = 1 tile.
- Gry online (`js/net/`, `server/`, `tictactoe.js`, `pong.js`) są w repo, ale wyłączone z menu.
- Ikony gier to pixel art rysowany w `js/core/icons.js` (canvas 16×16), bez emoji.
- Po kliknięciu gry na stronie głównej gra ma startować od razu, bez dodatkowych kliknięć.

## Styl
- Wygląd w klimacie Windows 95/98 (okno, pasek zadań, menu Start, przyciski 3D).
- Bez zaokrągleń, bez gradientów poza paskiem tytułu, czcionka Tahoma.
