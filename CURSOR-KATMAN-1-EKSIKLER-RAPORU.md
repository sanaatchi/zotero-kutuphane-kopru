<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, deep-bug-analiz, v0.1.16, marker-reocr, hizalama-20260807, citekey-merge, extra-rmw -->

# Cursor — Katman 1 Eksikler Raporu

**Tarih:** 2026-08-02 · **Sürüm:** köprü **v0.1.18** (Extra repair RMW hotfix; package.json 2026-08-07)  
**Durum:** A1–A7 ✅. A8 yanlış katman (OCR/watch K1 XPI’ye yok).

---

## Hizalama 2026-08-07 (K2 v1.0.154–160 sonrası)

**Kapsam:** Üç katman çapraz; K1 kodu yeniden yazılmadı — seam doğrulama.

| Seam | Durum | Not |
|------|-------|-----|
| package ↔ rapor | ✅ | **0.1.16** |
| 8077 bridge HTTP loopback | ✅ | `bridgeHttp.isAllowedBridgeBaseUrl` |
| 8756 OA/OCR | ✅ K2/K3 tüketicisi | K1 köprü XPI 8756’ya bağlanmaz; Marker tetik = `kutuphane-ocr` / Python |
| KP `normalizeKp` | ✅ | K2/K3 `kpToken` mirror |
| Yasak (OCR köprü XPI) | ✅ | A8 + strateji OCR haritası |
| Açık **P1** çapraz | **Yok** | Doc drift kök `uc-katman-stratejisi` → **düzeltildi** (0.1.16/1.0.160/1.0.65) |
| Citation Key dual-writer | ✅ soft | `mergePackageCitationKey` fail-closed (farklı geçerli KP ezilmez) |
| Extra repair RMW | ✅ **0.1.18** | repair success/fail: await sonrası taze `getField("extra")` + `applyRepairExtraFields` (K2 `ZPDF-*` korunur) |
| packageImport | ✅ spot-check | SHA-256 · `isPathInsideRoot` · idempotencyKey |
| Python `file_lock` | ✅ | `kitap_arsiv/file_lock.py` InterProcessFileLock (checkpoint concurrency) |

Canvas: `canvases/uc-katman-hizalama-20260807.canvas.tsx` (finalize)

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
| **A8** Yanlış katman | — | OCR/watch **köprü** XPI’ye eklenmez |

**OCR notu (2026-08-07):** Ağır Marker = Kütüphane Python (`marker_reocr` /
`marker_pdf_ocr` + `:8756/pdf-ocr-marker`). Köprü XPI motor eklemez (A8).
**İstisna:** ayrı tetik XPI `kutuphane-ocr` (kullanıcı; UI forku, motor köprüde).
Zotero-AI-OCR klasörü salt referans.

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
