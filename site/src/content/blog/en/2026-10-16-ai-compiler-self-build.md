---
title: "Can You Build a Programming Language with AI? Nova's First Compiler Hit a Dead End, the Second One Built Itself"
description: "Five and a half months of building Nova with AI agents: why the first compiler, Oracle in Rust, hit a dead end, how the second, Carina written in Nova, built itself byte for byte, and seven ways to check agents' work."
slug: "2026-10-16-ai-compiler-self-build"
date: "2026-10-16"
dateLabel: "October 16, 2026"
lang: "en"
tags: ["Article", "AI agents", "Compiler"]
excerpt: "Nova's first compiler, Oracle in Rust, hit a dead end: for a month the agents and I \"fixed\" type inference, reports were green, and nothing moved. The second, Carina, was written from scratch in Nova itself and built itself byte for byte. The full article is on Habr (in Russian)."
externalUrl: "https://habr.com/ru/articles/1095130/"
externalLabel: "Read the article on Habr (in Russian)"
---

A new long article is out about five and a half months of building Nova with AI agents. It is in Russian; here is what it covers.

The first compiler, Oracle in Rust, hit a dead end. For a month the agents and I reconciled two type inferences so that only one would remain: tests passed, reports were green, and the fallback inference only grew. I started the second compiler, Carina, from scratch in Nova itself, with rules that the machine checks on every build. On October 10 Carina built itself, and the two builds matched byte for byte. On October 11 the alpha releases Oracle 0.1.0 and Carina 0.2.0 came out.

In the article:

- how the fallback type inference appeared and why I took green reports for progress for a month;
- how release blockers went down to 36 and then up to 62;
- defect hunters, Carina's architecture and its donors: rustc, Go, Roslyn, Zig;
- why "CI is green except the known red step" meant the tests were not running;
- how the self-build works and what it does and does not prove;
- seven ways to check agents' work, drawn from these episodes;
- how to try Nova yourself.

[**Read the article on Habr (in Russian) →**](https://habr.com/ru/articles/1095130/)

[Download Oracle and Carina](/install/) · [GitHub repository](https://github.com/nv-lang/nova)
