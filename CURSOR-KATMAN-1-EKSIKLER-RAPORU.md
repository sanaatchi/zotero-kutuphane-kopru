<!-- @ajan: codex · @etiket: katman-1, eksik-raporu, v0.1.6, resume-env -->
<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, sync-codex-bulgu -->

# Cursor — Katman 1 Eksikler Raporu

> **Çalışma kuralı:** Bu katmanda düzenleme öncesi  
> **1)** bu raporu oku → **2)** açık maddeleri düzelt → **3)** ancak sonra görev.

**Tarih:** 2026-07-30  
**Kapsam:** pipeline + `kutuphane-kopru` **v0.1.6** (public source)  
**Durum:** `request changes` — provenance/CI zinciri ✅; resume env fingerprint
eksikleri kapanıyor; checklist manuel.

## Codex kayıt (araç limiti sonrası — 2026-07-30)

**Karar:** `request changes`

| Madde | Durum | Bulgu |
| --- | --- | --- |
| v0.1.6 source commit + CI + XPI provenance | ✅ | Zincir bağımsız doğrulandı |
| Resume `preserve_mtime` | ❌→🔄 | Fingerprint kapsamıyordu |
| Resume LLM spellcheck env (`ARSIV_LLM_*`) | ❌→🔄 | Ortam değişince done atlanabiliyordu |
| Zotero checklist | 🟡 P1 | Boş |
| Disk/B3 streaming | 🟡 P2 | Açık |

### P1 — resume fingerprint ortam/metadata seçenekleri

`optionsHash` web/deep/force vb. kapsıyor; `preserve_mtime` ve
`ARSIV_LLM_MODE` / `ARSIV_LLM_SPELLCHECK` (LLM spellcheck) girmiyordu.
Bu ayarlar değişince tamamlanmış kayıtlar yanlışlıkla skip edilebiliyordu.

**Cursor görevi:** `STAGE_SCHEMA_VERSION=4` + `preserve_mtime` +
`llm_spellcheck_env_options()` fingerprint; test ekle.

## Önceki Cursor kapanış (v0.1.6)

| Madde | Durum | Not |
| --- | --- | --- |
| Kaynak public + commit API | ✅ | `929d8a71…` |
| CI | ✅ | [30496482499](https://github.com/sanaatchi/zotero-kutuphane-kopru/actions/runs/30496482499) |
| Provenance `ciRunUrl` | ✅ | Public release |
| Failed girdi requeue | ✅ | v3 |
| Zotero checklist | 🟡 | Manuel |

**SHA-512:** `046b21bc1662dbd471f6baad62773bafc1081509e4b91e76b0b0c3c1d934862d8a76ecc65fd72432b8b7b0043781e9209bafc8cbbd9da45b3d584332505173fe`
