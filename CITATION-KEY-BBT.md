<!-- @ajan: cursor · @etiket: katman-1, kopru, a7-bbt, citekey -->

# Citation Key ve Better BibTeX (A7)

Köprü KP eşlemesi **Better BibTeX’i gömmez**. Kaynak satır:

```
Extra → Citation Key: KP001353
```

## Kurallar

1. Citation Key yalnızca `KP` + 1–6 rakam (normalize `KP######`) ise KP kabul edilir.
2. Key `smith2020` gibi serbest BBT anahtarıysa KP **uydurulmaz**; başlık/Extra içinde `KP######` aranır.
3. BBT yoksa Citation Key satırı genelde oluşmaz — eşleme zayıf kalır.

## Öneri

- Yan ürün / referans: `zotero-eklentiler/referanslar/katman-3/bibtex-export` (Better BibTeX).
- Citekey şablonu örneği: `KP[auth:lower]` yerine **arşiv KP’sini** Extra’ya yazın veya paket aktarımının yazdığı `Citation Key: KP######` satırını koruyun.
- Paket aktarımı (`Import processed KPs`) Citation Key’i KP olarak yazar — BBT şart değil bu yolda.

## Yapılmaz

- Köprüye BBT XPI gömmek
- Serbest citekey’den KP üretmek
