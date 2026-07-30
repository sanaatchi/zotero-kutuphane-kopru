<!-- @ajan: claude · @etiket: katman-1, eksik-raporu, kapandi -->

# Cursor — Katman 1 Eksikler Raporu

**Tarih:** 2026-07-30 · **Sürüm:** köprü v0.1.9  
**Durum:** P1 kod/provenance ✅. P2 disk manifest + B3 streaming hash kodda. Checklist ✅ kapandı.

| Madde                        | Durum | Not                                                   |
| ---------------------------- | ----- | ----------------------------------------------------- |
| Provenance / CI / resume env | ✅    |                                                       |
| Disk generation + manifest   | ✅    | `disk_pdf_index.manifest.json`; fail-after-full testi |
| B3 streaming SHA + root path | ✅    | chunked hash + canonical root check                   |
| Zotero checklist             | ✅    | Kullanıcı gerçek Zotero'da 8/8 yürüttü (`8aeb9d3`, v0.1.9) — #7 (ikinci ana pencere) Windows'ta N/A. |
