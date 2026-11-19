# GET /api/clients per sota de 300 ms

Fer que GET /api/clients deixi d’esperar 1200 ms i respongui per sota de 300 ms, sense canviar la forma JSON `{ data, meta }`.

La ruta a [src/app.js](src/app.js) crida `getClientsSlow()`. A [src/db.js](src/db.js) aquesta funció fa tres `await delay(400)` **en sèrie** (400 + 400 + 400 = 1200 ms). El cos de cada client (`id`, `name`, `company`, `owner`, `tags`) el construeix igual `getClientsFast()`, que ja existeix i no espera.

`Promise.all` de les tres esperes de 400 ms deixaria la ruta al voltant de **400 ms**, per sobre del límit. Per quedar-se per sota de 300 ms cal treure les esperes d’aquest endpoint.

## Pas

A [src/app.js](src/app.js), a `GET /api/clients`, substituir `getClientsSlow()` per `getClientsFast()` i actualitzar l’import. El `res.json` es queda igual: `{ data, meta: { count: data.length, note: 'endpoint lent (lab)' } }`. No es toca `meta.note` ni cap clau. Cap altre fitxer.

## Riscos

- Tres esperes de 400 ms en paral·lel continuen al voltant de 400 ms, per sobre de 300 ms. El límit només es compleix si la ruta deixa d’esperar.
- [tests/app.test.js](tests/app.test.js) no mesura temps. Un test verd no demostra el límit de 300 ms.
- `getClientsFast` ha de seguir resolent `owner` i `tags` igual que la versió lenta (5 clients). El contracte `{ data, meta }` no canvia.

## Validació

A l’arrel del projecte, `npm test` (Jest `--runInBand`). El test «clients amb token retorna llista» ha de seguir verd: estat 200 i `data.length > 0`, perquè el format `{ data, meta }` no canvia. El temps no el comprova Jest.
