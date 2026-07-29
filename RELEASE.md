<!-- @ajan: cursor · @etiket: katman-1, kopru, release, v0.1.5, provenance -->
# Kütüphane Köprü — yayın kanalı

**addonID:** `kutuphane-kopru@ibrahimyildiz.art`  
**Sürüm:** `0.1.5` (provenance + B3 hash verify + source CI)

## Canlı kanallar

| Kanal | URL |
|-------|-----|
| Source repo | https://github.com/sanaatchi/zotero-kutuphane-kopru |
| Release repo | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases |
| v0.1.5 XPI | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/tag/v0.1.5 |
| `update.json` | https://github.com/sanaatchi/zotero-kutuphane-kopru-releases/releases/download/update/update.json |

## Kurulum

1. XPI indir (v0.1.5) veya `npm run build` → `build/zotero-kutuphane-kopru.xpi`
2. Zotero → Araçlar → Eklentiler → Dosyadan yükle
3. Tercihler → Kütüphane kök = proje kökü

## Yeni sürüm (provenance zorunlu)

```bash
cd zotero-eklentiler/kutuphane-kopru
# package.json version bump → commit + push main
npm test && npm run build
# SHA-512 (PowerShell):
# Get-FileHash build/zotero-kutuphane-kopru.xpi -Algorithm SHA512
# provenance.json: sourceRepo, sourceCommit (full SHA), update_hash, builtAt
gh release create vX.Y.Z \
  build/zotero-kutuphane-kopru.xpi provenance.json \
  --repo sanaatchi/zotero-kutuphane-kopru-releases
gh release upload update build/update.json \
  --repo sanaatchi/zotero-kutuphane-kopru-releases --clobber
```

## CI

`.github/workflows/ci.yml` — nested source repo: test + tsc + build.
