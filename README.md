# nv-lang/www

Source for [nv-lang.org](https://nv-lang.org) — the Nova programming language website.

Built with **[Astro](https://astro.build)** — a static site generator. The build
produces plain HTML/CSS with zero JavaScript framework runtime; GitHub Actions
deploys `dist/` to GitHub Pages.

## Develop

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # preview the built dist/
```

Requires Node 18.20.8+ / 20.3+ / 22+.

## Structure

```
src/pages/         pages — file path maps to URL
src/layouts/       BaseLayout — shared page shell
src/components/    Head, Header, Footer
src/partials/      page content (verbatim HTML)
src/styles/        global stylesheet
public/            static assets served as-is
```

See [CLAUDE.md](CLAUDE.md) for the full guide.

## License

Content licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
See [LICENSE](LICENSE).
