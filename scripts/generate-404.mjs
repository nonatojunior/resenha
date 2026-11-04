/**
 * Gera o 404.html do GitHub Pages com o fallback de SPA.
 * O GitHub Pages não reescreve rotas; ao abrir /resenha/qualquer-coisa,
 * ele serve o 404, que devolve o caminho para o index via query string.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const base = process.env.VITE_BASE_PATH ?? '/resenha/';
const normalizedBase = base.endsWith('/') ? base : `${base}/`;

const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Resenha Secreta</title>
    <script>
      (function () {
        var base = ${JSON.stringify(normalizedBase)};
        var path = window.location.pathname;
        if (path.indexOf(base) === 0) {
          path = path.slice(base.length);
        } else {
          path = path.replace(/^\\/+/, '');
        }
        var target = base + '?redirect=' + encodeURIComponent(path + window.location.search + window.location.hash);
        window.location.replace(target);
      })();
    </script>
  </head>
  <body>
    <p>Redirecionando para a Resenha Secreta…</p>
    <p><a href="${normalizedBase}">Continuar</a></p>
  </body>
</html>
`;

const targetDir = resolve(process.cwd(), 'dist');
await mkdir(targetDir, { recursive: true });
await writeFile(resolve(targetDir, '404.html'), html, 'utf8');
console.log(`404.html gerado em dist/ (base: ${normalizedBase})`);
