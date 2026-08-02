<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, deep-bug-analiz, v0.1.16 -->

# Cursor — Katman 1 Eksikler Raporu

**Tarih:** 2026-08-02 · **Sürüm:** köprü **v0.1.16**  
**Durum:** A1–A7 ✅. A8 yanlış katman (OCR/watch K1 XPI’ye yok).

| Madde | Durum | Not |
|-------|-------|-----|
| Provenance / CI / resume env | ✅ | |
| Disk generation + manifest | ✅ | |
| B3 streaming SHA + root path | ✅ | |
| Zotero checklist | ✅ | |
| Native ItemPane KP | ✅ | v0.1.10 |
| **A1** Pipeline 6+1 stages | ✅ | v0.1.11 |
| **A2** Durum panosu | ✅ | v0.1.12 |
| **A3** Paket dry-run / rapor | ✅ | v0.1.13 |
| **A4** ItemPane zenginleştirme | ✅ | v0.1.14 |
| **A5** Opt-in HTTP 8077 | ✅ | v0.1.15 |
| **A6** Ters senkron raporu | ✅ | v0.1.16 |
| **A7** BBT / Citation Key | ✅ | `CITATION-KEY-BBT.md` |
| **A8** Yanlış katman | — | OCR/watch K1 XPI’ye eklenmez |

---

## Derin bug analizi (v0.1.16) — 2026-08-02

**Yöntem:** Modüller satır satır; `bridge.py` ↔ `parseBridgeStatusJson` /
`parseBridgePipelineJson`; `disk_pdf_index*` alanları; KP `\bKP0*\d{1,6}\b`
sınır senaryoları. Cursor çapraz: **36/36** test yeşil (`npm test`).

| Bulgu sınıfı | Sonuç |
|--------------|--------|
| Confirmed fonksiyonel bug | **Yok** |
| Python↔TS sözleşme drift | **Yok** — `occupiedCount`/`nextKp`, diskIndex, handoffPackage, `categories[].stages[]` uyumlu |
| KP regex taşma (KP1234567) | Doğru red (`\b`); sessiz kesme yok |
| Idempotency / SHA / path | SQL LIKE sonrası JS tam eşleşme; streaming SHA |
| Multi-window lifecycle | Son pencere → unregister; ItemPane ayrı bayrak |
| Locale tr-TR / en-US | Kullanılan `getString` anahtarları mevcut |
| A5 HTTP | Opt-in default false; yalnız loopback; SSRF kapalı |

### Sertleştirme notları (bug değil)

1. `isPathInsideRoot` — string prefix; `..` çözümü `IOUtils.getFile` normalize’a bağlı. Güvenilir yerel handoff altında pratik risk yok.
2. `probeFile` + boş `allowedRoot` — çağıran yollarda root boşsa erken return; ölü savunma.

### Sonraki (isteğe bağlı)

- XPI yayın (v0.1.16)
- Zotero kabul checklist yenileme (K2 G2 benzeri)
- `isPathInsideRoot` için normalize+resolve ek test (P3)
