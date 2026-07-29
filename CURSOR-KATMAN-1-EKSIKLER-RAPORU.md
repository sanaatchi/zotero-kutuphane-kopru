<!-- @ajan: cursor · @etiket: katman-1, eksik-raporu, v0.1.6, resume-v4 -->

# Cursor — Katman 1 Eksikler Raporu

> **Çalışma kuralı:** Bu katmanda düzenleme öncesi  
> **1)** bu raporu oku → **2)** açık maddeleri düzelt → **3)** ancak sonra görev.

**Tarih:** 2026-07-30  
**Kapsam:** pipeline + `kutuphane-kopru` **v0.1.6**  
**Durum:** Codex provenance/CI ✅; resume env P1 kodda kapatıldı (v4). Checklist manuel.

## Codex kayıt (araç limiti sonrası) + Cursor düzeltme

| Madde | Durum | Not |
| --- | --- | --- |
| v0.1.6 source/CI/XPI provenance | ✅ | Public zincir doğrulandı |
| Resume `preserve_mtime` | ✅ | `optionsHash` + metadata stage |
| Resume `ARSIV_LLM_*` / LLM spellcheck | ✅ | `llm_spellcheck_env_options()` · schema v4 |
| Zotero checklist | 🟡 P1 | Manuel |
| Disk/B3 streaming | 🟡 P2 | Açık |

**Doğrulama:** pytest `tests/test_stage_resume.py` 9/9  
**SHA-512 (v0.1.6):** `046b21bc1662dbd471f6baad62773bafc1081509e4b91e76b0b0c3c1d934862d8a76ecc65fd72432b8b7b0043781e9209bafc8cbbd9da45b3d584332505173fe`  
**CI:** https://github.com/sanaatchi/zotero-kutuphane-kopru/actions/runs/30496482499
