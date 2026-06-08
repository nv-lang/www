---
title: "Hello, Nova"
description: "Introducing Nova: what it is, why I am building it, and what works today — algebraic effects, static contracts, M:N runtime, and documentation tooling."
slug: "2026-05-18-hello-nova"
date: "2026-05-18"
dateLabel: "May 18, 2026"
lang: "en"
tags: ["Announcement", "Language"]
excerpt: "Introducing Nova — what it is, why I am building it, and what works today: algebraic effects, static contracts, M:N runtime, and documentation tooling. A look at the bootstrap stage and the road ahead."
---

Today I am opening the doors on **Nova** — a general-purpose systems programming language I have been building in the open. This post explains what Nova is, why it exists, and what already works right now.

Nova is not yet another "safe C replacement" nor a JavaScript killer. It is a language whose central bet is this: *if you make side effects and invariants first-class citizens of the type system, you eliminate entire categories of bugs before the program ever runs.*

## The problem with invisible behavior

Most languages let functions lie. A function named `get_user` might query a database, make an HTTP call, write a log line, and cache the result in a global map — and none of that is visible in its signature. The caller has no way to know without reading the body. Tests have to mock the world. Reviewers have to hold everything in their heads.

This is the problem Nova is designed to solve. In Nova, every side effect must appear in the function's type — between the parameter list and the return arrow. If a function touches the database, `Db` appears in its type. If it writes logs, so does `Log`. If it does neither, the type checker proves it cannot.

The signature is not documentation that might be wrong — it is a constraint the compiler enforces.

## Three ideas, one language

### 1. Algebraic Effects

Effects in Nova are first-class interfaces. You declare an effect, provide a handler, and inject it at the call boundary. This gives you all the power of dependency injection with none of the ceremony — and the type system tracks it automatically.

```nova
// The signature is the contract with the caller:
// give me a positive id, I give you a User or NotFound,
// and I will only touch Db and Log — nothing else.
fn fetch_user(id u64) Db Log -> Result[User, NotFound]
    requires id > 0
{
    log("fetching", {id: id.to_str()})
    match db.find_user(id) {
        Some(u) => Ok(u)
        None    => Err(NotFound)
    }
}
```

User-defined effects let you model any capability as an abstract interface. Testing becomes trivial: swap the production `Db` handler for an in-memory one at the call site, and you get complete isolation without a mocking framework.

### 2. Static Contracts

Nova contracts are `requires`, `ensures`, and `invariant` clauses attached to functions and types. The compiler feeds them to an SMT solver (currently Z3) and tries to discharge them at compile time. When static checking is not possible — typically because the constraints depend on runtime data — they fall back to runtime assertions in debug builds and are erased in release builds.

The key insight is that *contracts are not assertions*. An assertion is a runtime check you add after the fact. A contract is a specification you write alongside the code, and the compiler uses it to reason across call boundaries. A function that calls `fetch_user` with a literal `0` gets a compile-time error, not a runtime panic.

### 3. M:N Runtime

Nova's runtime multiplexes lightweight fibers over OS threads using a work-stealing scheduler — the same model Go pioneered, applied to a statically typed language with effects. Spawning a fiber is cheap (a few hundred nanoseconds). Blocking on I/O yields the fiber and lets the scheduler run other work on the same thread. No `async` keyword. No colored functions. Blocking code and concurrent code look the same.

```nova
// The full set of capabilities is in the signature.
// No hidden globals. No implicit async runtime.
fn serve_api() Net Http Log -> ()
{
    let router = Router.new()
        .route(Get,  "/users/:id", get_user)
        .route(Post, "/users",    create_user)

    serve("0.0.0.0:8080", router.dispatch())
}
```

For latency-sensitive work, you can annotate a function `realtime nogc` to tell the compiler and runtime that no GC-managed allocation is allowed in that scope. The compiler verifies this statically. A competitive game loop, a DSP callback, a lock-free queue — these are first-class use cases, not afterthoughts.

## What works today

Nova is in the bootstrap stage. That means the compiler exists and compiles real programs, but the standard library is incomplete and the language surface is still stabilizing. Here is an honest accounting of what works:

- **Core type system** — structs, enums, generics, traits, `Option[T]`, `Result[T, E]`, type inference, and pattern matching all work.
- **Effects** — effect types in function signatures are enforced by the type checker. Built-in effects (`Io`, `Net`, `Db`, `Log`, `Rand`, `Time`, `Fs`) are recognized. User-defined effects with custom handlers work in the current compiler.
- **Contracts** — `requires` and `ensures` clauses are parsed and checked. SMT integration (Z3) is functional for linear arithmetic. Runtime fallback for non-provable constraints works. Struct `invariant` is implemented and enforced (including the rule that redundant field specs are rejected).
- **M:N runtime** — the fiber scheduler runs, `spawn` works, and channels are usable. Work-stealing across threads is implemented. I/O is fiber-aware on Linux (io_uring) and macOS (kqueue).
- **Documentation tooling** — `nv doc` generates HTML documentation from doc comments. The format is specified in D45.
- **Standard library** — `core` (types, traits), `io` (basic file and console I/O), `net` (TCP sockets), and `collections` (Vec, Map, Set) are usable. HTTP, crypto, and database drivers are in progress.

What is not ready: a stable package manager, a language server, Windows support, and the concurrent GC (the current GC is Boehm, which is stop-the-world). These are all on the near-term roadmap.

## Effects and contracts together

The real power of Nova shows up when effects and contracts work together. Consider a function that must only be called inside an authenticated request context and must only touch the database:

```nova
fn charge_card(
    ctx    AuthCtx,
    amount Money,
    card   CardToken,
) Db Net Log -> Result[ChargeId, PaymentError]
    requires ctx.is_authenticated()
    requires amount > Money.ZERO
    requires amount <= Money.MAX_SINGLE_CHARGE
{
    log("charging", {user: ctx.user_id.to_str(), amount: amount.to_str()})
    let result = payment_gateway.charge(card, amount)?
    db.record_charge(ctx.user_id, result.id, amount)?
    Ok(result.id)
}
```

The preconditions (`requires`) tell callers exactly what must be true before calling. Effects in the type list every external system touched. A code reviewer — or an LLM generating the caller — can understand the full contract from the signature alone, without reading the body.

## Why now?

Two trends converge to make this the right time for Nova.

First, the tooling to enforce these constraints has matured. SMT solvers like Z3 and CVC5 are fast enough to run in a compiler feedback loop. Algebraic effect systems have moved from academic papers to production compilers (Koka, Effekt, OCaml 5). The pieces exist; Nova assembles them into a practical language.

Second, LLMs now write a substantial fraction of production code. Code generated by LLMs tends to be syntactically correct but semantically underspecified — the effects and invariants are in the programmer's head, not in the code. A language where effects and contracts are mandatory, not optional, turns compiler errors into a learning signal for both humans and models. Nova is designed for the era where the compiler is the primary reviewer.

## What comes next

The near-term roadmap (Plans 60–64 in the repository) covers:

- The `nv` package manager: manifest format, dependency resolution, and a public registry
- Language server (`nova-lsp`): completions, go-to-definition, inline contract diagnostics
- Concurrent GC to replace Boehm
- Windows toolchain support
- Standard library completion: HTTP server/client, TLS, SQL, and serialization

The specification is public, the compiler is open source, and the design process happens on GitHub. If any of this resonates with you, the best way to follow along is to [star the repository](https://github.com/nv-lang/nova) and read the D-blocks.

I am also accepting contributions. The [contributor guide](https://github.com/nv-lang/nova/blob/main/CONTRIBUTING.md) explains where help is most needed right now.

The language is young. The ideas are not. I look forward to building it with you.

---

[View on GitHub](https://github.com/nv-lang/nova) · [Read the docs](/doc/) · [Language spec](/spec/)
