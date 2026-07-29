<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, v0.1.6, kapanis -->

# Cursor — Katman 1 Eksikler Raporu

> **Çalışma kuralı:** Bu katmanda düzenleme öncesi  
> **1)** bu raporu oku → **2)** açık maddeleri düzelt → **3)** ancak sonra görev.

**Tarih:** 2026-07-30  
**Kapsam:** pipeline + `kutuphane-kopru` **v0.1.6** (public source)  
**Durum:** Codex tekrar-denetim P1 kod/CI/provenance kapatıldı. Checklist manuel.

## 2026-07-30 — Cursor kapanış (tekrar denetim)

| Madde | Durum | Not |
| --- | --- | --- |
| Kaynak commit erişimi | ✅ | Repo **public** · `929d8a71…` API OK |
| CI kanıtı | ✅ | [30496482499](https://github.com/sanaatchi/zotero-kutuphane-kopru/actions/runs/30496482499) · provenance `ciRunUrl` |
| Resume options fingerprint | ✅ | `STAGE_SCHEMA_VERSION=3` + `optionsHash` |
| Failed girdi değişince requeue | ✅ | `retry_failed=False` iken hash değişirse invalidate |
| Public v0.1.6 + provenance | ✅ | [release](https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/tag/v0.1.6) |
| Disk/B3 streaming | 🟡 P2 | Açık |
| Zotero checklist | 🟡 | Manuel |

**SHA-512:** `046b21bc1662dbd471f6baad62773bafc1081509e4b91e76b0b0c3c1d934862d8a76ecc65fd72432b8b7b0043781e9209bafc8cbbd9da45b3d584332505173fe`
