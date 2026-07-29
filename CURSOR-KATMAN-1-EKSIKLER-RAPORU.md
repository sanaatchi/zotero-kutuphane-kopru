<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, v0.1.5, kapanis -->

# Cursor — Katman 1 Eksikler Raporu

> **Çalışma kuralı:** Bu katmanda düzenleme öncesi  
> **1)** bu raporu oku → **2)** açık maddeleri düzelt → **3)** ancak sonra görev.  
> Rule: `.cursor/rules/katman-eksik-raporu.mdc`

**Tarih:** 2026-07-30

**Kapsam:** ağır Python pipeline + `kutuphane-kopru` **v0.1.5**

**Durum:** kod/CI/provenance P1 kapatıldı. Gerçek Zotero checklist manuel kalır.

## 2026-07-30 — Cursor kapanış (Codex sırası)

| Madde | Durum | Not |
| ----- | ----- | --- |
| Source commit + nested CI | ✅ | `0184e53` · [CI 30495703240](https://github.com/sanaatchi/zotero-kutuphane-kopru/actions/runs/30495703240) |
| Provenance’lı patch release | ✅ | [v0.1.5](https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/tag/v0.1.5) + `provenance.json` |
| 6+1 resume fingerprint/hash | ✅ | `STAGE_SCHEMA_VERSION=2`, input hash invalidation |
| Disk index `scan_id` kuşağı | ✅ | summary+full aynı `scan_id` |
| B3 attachment hash verify | ✅ | complete yalnız paket SHA eşleşince |
| Gerçek Zotero checklist | 🟡 | Manuel — `ZOTERO-KABUL-CHECKLIST.md` |

**SHA-512:** `e841cb29f11813458076217aa4f505f56fe9220a3243f87b9040c93b1765ac7243b932fc39f3751d7939c55e690fcea7894ab58595f8f9fb897eae6eba8585d7`

### Kalan (opsiyonel / P2)

- Disk index: ikinci move hata enjeksiyonu + manifest pointer (scan_id var; full protokol kısmi)
- B3 streaming hash (şu an tam dosya `IOUtils.read`)
- Kullanıcı Zotero checklist
