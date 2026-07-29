<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, v0.1.5, kapanis -->

# Cursor — Katman 1 Eksikler Raporu

> **Çalışma kuralı:** Bu katmanda düzenleme öncesi  
> **1)** bu raporu oku → **2)** açık maddeleri düzelt → **3)** ancak sonra görev.  
> Rule: `.cursor/rules/katman-eksik-raporu.mdc`

**Tarih:** 2026-07-30

**Kapsam:** ağır Python pipeline + `kutuphane-kopru` v0.1.5

**Durum:** `in progress` — kod düzeltmeleri uygulandı; source commit/CI/provenance
v0.1.5 yayınlandıktan sonra P1 kapanır. Gerçek Zotero checklist manuel kalır.

## 2026-07-30 — Cursor sırası (Codex request changes sonrası)

| Madde | Durum | Not |
| ----- | ----- | --- |
| Source commit + nested CI | 🔄 | v0.1.5 + `.github/workflows/ci.yml` |
| Provenance’lı patch release | 🔄 | `provenance.json` zorunlu |
| 6+1 resume fingerprint/hash | ✅ | `STAGE_SCHEMA_VERSION=2`, input hash invalidation |
| Disk index `scan_id` kuşağı | ✅ | summary+full aynı `scan_id` |
| B3 attachment hash verify | ✅ | complete yalnız paket SHA eşleşince |
| Gerçek Zotero checklist | 🟡 | Manuel — kullanıcı |

### Kabul şartları (kalan)

1. `sanaatchi/zotero-kutuphane-kopru` main’de yeşil CI run
2. Public v0.1.5 XPI + `provenance.json` (source SHA + SHA-512)
3. Kullanıcı Zotero checklist doldurur (`ZOTERO-KABUL-CHECKLIST.md`)

## Arşiv — Codex 2026-07-30 derin analiz

Önceki `request changes` maddeleri (v0.1.4 provenance yok, resume hash yok,
B3 any-attachment) bu turda kodda kapatıldı; yayın kanıtı v0.1.5 ile gelir.
