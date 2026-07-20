# Untuk-nia icon assets

These are placeholder icons used by the mini quiz and quotes features.
Replace any file with your own asset (same filename) whenever you want —
the code only knows about the paths, not the artwork.

| File                     | Where it's used                                                                                                        | Rendered size |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------- |
| `love-letter.png`        | Floating **quiz** button (bottom-right). Path lives at `QUIZ_BUTTON_ICON` in `_data/quiz.ts`.                           | 32 – 40 px    |
| `quote.svg`              | Floating **quote** button (stacked above the quiz button). Path lives at `QUOTE_BUTTON_ICON` in `_data/quiz.ts`.        | 32 – 40 px    |
| `book.png`               | "Pilihan Ganda" chip inside quiz modal. Configured in `QUIZ_TYPE_META.choice.icon`.                                     | 20 px         |
| `valentine-calendar.png` | "Pilih Tanggal" chip inside quiz modal. Configured in `QUIZ_TYPE_META.date.icon`.                                       | 20 px         |
| `close.svg`              | The `×` button in every modal header.                                                                                   | 20 px         |
| `next.svg`               | Arrow inside "Selanjutnya" / "Selesai" buttons (quiz).                                                                  | 16 px         |
| `submit.svg`             | Arrow inside the "Submit Jawaban" button on date questions.                                                             | 16 px         |
| `correct.svg`            | Big feedback icon shown when a quiz answer is correct.                                                                  | 96 px         |
| `wrong.svg`              | Big feedback icon shown when a quiz answer is wrong.                                                                    | 96 px         |
| `check.svg`              | Small ✅ badge on floating buttons (once everything is solved/seen) and on already-solved options in quiz review mode. | 20 – 24 px    |
| `celebrate.svg`          | Big hero icon on the quiz "Selesai!" celebration screen.                                                                | 112 px        |
| `quiz.svg`               | (Legacy) previously used as the quiz button icon; unused right now, kept for easy swap-back if you want an SVG.         | —             |

Tips when swapping:

- The icon file controls its own colors (fill, stroke). If your art needs to
  match a specific background (e.g. the floating buttons sit on a pink
  gradient), bake the color into the file itself.
- Prefer square viewBoxes / aspect ratios so the icon scales cleanly at
  every render size.
- Nothing else needs to change if you keep the same filename.
