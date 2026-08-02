<!-- @ajan: cursor · @etiket: katman-1, kopru, plan, kapanis, v0.1.4 -->
# Katman 1 — Kütüphane ↔ Zotero köprü eklentisi

> **Oturum başı:** [`CURSOR-KATMAN-1-EKSIKLER-RAPORU.md`](CURSOR-KATMAN-1-EKSIKLER-RAPORU.md) oku → düzelt → sonra faz/görev.  
> Rule: `katman-eksik-raporu.mdc`

**Durum:** ✅ **Tamam** — B0–B3 + P1/P2 + v0.1.4 public release (2026-07-30)

**Strateji SSOT:** [`../../docs/uc-katman-stratejisi.md`](../../docs/uc-katman-stratejisi.md)

**Katman 1 plan:** [`../../docs/KATMAN-1-PLAN.md`](../../docs/KATMAN-1-PLAN.md)

## Amaç

Kütüphane ağır iş hattının Zotero ile konuşan **ince yüzü**. OCR/rename yapmaz.

## addonID

`kutuphane-kopru@ibrahimyildiz.art` · ref `kutuphanekopru` · **v0.1.16**

## Fazlar

| Faz | Ne | Durum |
|-----|-----|-------|
| **B0** | Scaffold + `kutuphaneRoot` pref + durum menüsü | ✅ |
| **B1** | Seçili öğe Citation Key ↔ `kp_registry.json` | ✅ |
| **B2** | Pipeline checkpoint / son batch özeti | ✅ |
| **B3** | İşlenmiş KP’leri Zotero’ya aktar | ✅ v0.1.4 |

## Çalıştırma

```bash
cd zotero-eklentiler/kutuphane-kopru
npm install
npm test
npm run build
```

**Yayın:** [`RELEASE.md`](RELEASE.md) · [v0.1.4](https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/tag/v0.1.4)  
**CI:** `.github/workflows/kutuphane-kopru.yml`  
**Kabul:** [`ZOTERO-KABUL-CHECKLIST.md`](ZOTERO-KABUL-CHECKLIST.md)

Zotero: Tercihler → Kütüphane kök = `C:\Users\…\Kutuphane`  
Araçlar → Kütüphane Köprü → durum / KP eşlemesi / ters senkron / pipeline / paket

## Citation Key

Bkz. [`CITATION-KEY-BBT.md`](CITATION-KEY-BBT.md) — BBT gömülmez; KP = `KP######`.

## Yapmaz

OCR, rename, PDF metadata (Katman 2), harita (Katman 3).
