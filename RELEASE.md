<!-- @ajan: cursor · @etiket: katman-1, kopru, release, v0.1.10, provenance -->
# Kütüphane Köprü — yayın kanalı

**addonID:** `kutuphane-kopru@ibrahimyildiz.art`  
**Sürüm:** `0.1.10`

## Canlı kanallar

| Kanal | URL |
|-------|-----|
| Source (public) | https://github.com/sanaatchi/zotero-kutuphane-kopru |
| Release | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases |
| v0.1.10 | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/tag/v0.1.10 |
| update.json | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/download/update/update.json |

## Yayın

```bash
cd zotero-eklentiler/kutuphane-kopru
npm test && npm run build
npm run gh-release
```

## CI

`.github/workflows/ci.yml` — action ref'leri immutable SHA; test + tsc + build.
