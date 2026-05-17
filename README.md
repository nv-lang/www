# nv-lang/www

Source for [nv-lang.org](https://nv-lang.org) — the Nova programming language website.

## Stage

Phase 0 (bootstrap): plain static HTML on GitHub Pages.

Future phases will replace this with a generator written in Nova itself, then
with an HTTP server written in Nova (dogfooding initiative, see `nv-lang/nova`
plan 60 when published).

## Structure

```
index.html       English entry
ru/index.html    Russian translation
style.css        Shared minimal style
CNAME            Custom domain for GitHub Pages
```

No build step. Edit, commit, push — GitHub Pages serves it.

## Local preview

Open `index.html` in a browser, or run a simple server:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000/
```

## License

Content licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
See [LICENSE](LICENSE).
