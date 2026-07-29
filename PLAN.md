<!-- @ajan: cursor · @etiket: katman-1, kopru, plan, kutuphane, b0, b1 -->
# Katman 1 — Kütüphane ↔ Zotero köprü eklentisi

**Durum:** B0–B2 ✅ (v0.1.1) — scaffold, kök pref, KP eşleme, pipeline özeti.

**Strateji SSOT:** [`../../docs/uc-katman-stratejisi.md`](../../docs/uc-katman-stratejisi.md)

**Katman 1 plan:** [`../../docs/KATMAN-1-PLAN.md`](../../docs/KATMAN-1-PLAN.md)

## Amaç

Kütüphane ağır iş hattının Zotero ile konuşan **ince yüzü**. OCR/rename yapmaz.

## addonID

`kutuphane-kopru@ibrahimyildiz.art` · ref `kutuphanekopru`

## Fazlar

| Faz | Ne | Durum |
|-----|-----|-------|
| **B0** | Scaffold + `kutuphaneRoot` pref + durum menüsü | ✅ |
| **B1** | Seçili öğe Citation Key ↔ `kp_registry.json` | ✅ |
| **B2** | Pipeline checkpoint / son batch özeti | ✅ |
| **B3** | İşlenmiş KP’leri Zotero’ya aktar | sonra |

## Çalıştırma

```bash
cd zotero-eklentiler/kutuphane-kopru
npm install
npm test
npm run build
```

Zotero: Tercihler → Kütüphane kök = `C:\Users\…\Kutuphane`  
Araçlar → Kütüphane Köprü → durum / seçili KP eşlemesi

## Yapmaz

OCR, rename, PDF metadata (Katman 2), harita (Katman 3).
