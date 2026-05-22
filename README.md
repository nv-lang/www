# nv-lang/www

Source for [nv-lang.org](https://nv-lang.org) — the Nova programming language website.

Built with **[Astro](https://astro.build)** — a static site generator. The build
produces plain HTML/CSS with zero JavaScript framework runtime; GitHub Actions
deploys it to GitHub Pages.

## Layout

```
site/      the website — an Astro project
plans/     development plans
.github/   CI workflows
```

## Develop

From the `site/` directory:

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # → site/dist/
npm run preview    # preview the built output
```

Requires Node 18.20.8+ / 20.3+ / 22+. See [CLAUDE.md](CLAUDE.md) for the full guide.

## License

Content licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
See [LICENSE](LICENSE).
