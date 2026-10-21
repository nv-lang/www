---
title: "Why Nova's Syntax Looks the Way It Does: 11 Arguments with Claude About Language Design"
description: "Eleven stories of how arguing with an AI agent shaped Nova's syntax: effects, arrays, methods, ro/mut/consume, pointers, field visibility. Plus a checklist of when to push back on AI and when to agree."
slug: "2026-10-19-syntax-arguments-with-claude"
date: "2026-10-19"
dateLabel: "October 19, 2026"
lang: "en"
tags: ["Article", "Language design", "AI agents"]
cover: "/blog/2026-10-19-syntax-arguments-with-claude/cover-en.png"
excerpt: "\"!throws looks like not.\" That one line was enough for Claude to drop its own effect syntax, while declaring a method took five rounds. Eleven stories of why Nova's syntax is the way it is, and a checklist of when to push back on AI and when to agree."
---

"`!throws` looks like `not`." That one line was enough for Claude to drop its own effect syntax. Declaring a method, on the other hand, took five rounds. And sometimes Claude talks me out of things too.

I'm building [Nova](https://nv-lang.org/), a language for backends and server programs, similar to Go and Rust. One of its key features is effects: a function declares right in its signature what it does to the outside world (talks to the network, reads the clock, touches files, may fail, and so on), and the implementation of an effect can be swapped at runtime, for example in tests. Nova compiles to C and has a garbage collector and an M:N runtime: lightweight tasks on top of OS threads, like goroutines in Go.

I design the language together with AI agents, mostly Claude: I set the direction, Claude proposes options and rationale, I choose and often say "no". Almost every notable decision in Nova's syntax has a story like this: Claude held on to its position and I had to break it. Of course, you can just give an agent orders. But I always let it make its case and accept the idea if it is genuinely good and fits my vision. And almost every time the result was better than what Claude defended at the start.

Below are eleven of those stories. Each one explains why Nova works the way it does today and what I took from it for working with AI on a long project.

## Where it all started: the garbage collector

The biggest reversal, dropping the `~T` memory prefixes in favour of a garbage collector after the argument "Kubernetes is written in Go", is covered in [another article](/blog/2026-06-08-month-with-claude/). The short version: Claude defended a decision it had once proposed itself for weeks, and gave in only to a precedent from the real world. That pattern will come up again below.

## "`!throws` looks like `not`"

In one of the early versions of the syntax, Claude proposed marking effects with an exclamation mark:

```nova
fn save(u User) !throws io async -> ()
```

The reasoning was logical: `!` is free, isn't used for anything important, and resembles Swift. I replied with one line: "`!throws` looks like `not`." Claude agreed almost immediately. Effects became plain words between `)` and `->` in a function or method declaration, with no extra markers:

```nova
fn save(u User) Throws Io Async -> ()
```

The language kept changing: `Throws` was renamed to `Fail`, and `Async` was removed from the type system altogether, since asynchrony became the job of the M:N runtime. But the principle stayed: effects are written as words, and a signature reads without decoding.

![How the effect syntax changed: !throws io async, then Throws Io Async, today Fs Fail[IoError]](/blog/2026-10-19-syntax-arguments-with-claude/f5-effects-en.png)

AI reasons logically ("the symbol is free"), while a human sees how a line reads at first glance. AI can't do that yet.

## Arrays that would have read backwards

At first, arrays in Nova were written as `[T]`, Rust and Swift style. Claude defended it like this: "consistent with the generics `Option[T]`, `HashMap[K, V]`, the parser is unambiguous." I disagreed and asked questions: how do you declare a nested array, what about maps, does the order of dimensions in the declaration match the order in an access like `arr[i][j]`?

The last question settled it. In Go, `[2][3]int` reads in the same order as `arr[i][j]`. In Rust, `[[T; 3]; 2]` reads the other way round, and people have long complained about it. Claude reweighed: matching the indexing order matters more than neat consistency with generics, and the parser stays unambiguous by position. Nova kept Go-style arrays: `[]T`, `[N]T`, `[N1][N2]T`. About thirty places in the docs had to be fixed. Rust's notation has every right to exist, but it's not to my taste.

![Order of dimensions: in Go and Nova, [2][3]int and a[i][j] go in the same order; in Rust, [[T; 3]; 2] is written the other way round](/blog/2026-10-19-syntax-arguments-with-claude/f1-arrays-en.png)

## `&T`, which survived everything by inertia

After the memory prefixes were dropped, Claude kept one: `&T`, a borrow, as in Rust. A function gets access to a value without copying it and without involving the garbage collector. Claude justified it with performance: such a parameter would help in code that runs very often and where every allocation counts.

```nova
fn analyze(data &[]f64) -> Stats =>
    Stats { mean: data.mean(), sum: data.sum() }
```

I asked why we needed it. Claude defended it at first, then went through it point by point. Rust has borrowing because it has no garbage collector. In Nova, with a collector, passing an object already means passing a pointer. Escape analysis covers most "for performance" cases. A slice is already cheap to pass, as a pointer plus a length. And lifetime checking is very expensive to implement.

So `&T` came into the design from Rust and outlived the other prefixes simply because nobody asked whether it was still needed. In the end, Claude and I removed it. A garbage-collected language doesn't need lifetime checking in the form Rust needs it.

## Small things caught by eye

Four short stories. Three of them have the same cause: AI mixes habits from different languages and doesn't notice.

**Function body: `=` or `=>`.** In Claude's examples a lambda was written `(x) => x + 1`, and an anonymous function `fn(x int) -> int = x * 2`. I asked: "so we declare functions without `fn` now?" Two notations for the same thing lived side by side. Claude reviewed its own examples and found another mismatch: a single-expression body came after `=>` in a lambda but after `=` in an anonymous function, a leftover from an earlier version of the syntax. The sign was unified: if the body of a function declared with `fn` is a single expression, it goes after `=>`, for example `fn(x int) -> int => x * 2`. A body of several statements is still written in curly braces. As a bonus, `=>` now matches a `match` arm, where a result also follows it: `Circle(r) => 3.14 * r * r`. The sign has one meaning now. And the short lambda later got its own notation, with no arrow at all: `|x| x + 1`.

**`pub` and `import`.** Exporting used `pub fn`, as in Rust, and importing used `import`, as in Java and Python. I asked: if there's `import`, why not `export`? A Rust-style pair would have given `use`, but that word was already taken in Nova, and I didn't like it anyway. In the end we went with `export` and `import`, words that are opposites.

**`IO`, `FS` and `Db`.** In the docs, effects were named `Db` in some places and `IO` and `FS` in caps in others. Claude had no justification: capitalised acronyms came from Java (`IOException`, `URLConnection`). We introduced one rule for all: `Db`, `Io`, `Fs`, `Http`, `Json`.

**Result type: `:` or `->`.** This one isn't about AI but about my old gripe with TypeScript: there, the result type in a declaration comes after a colon, `function f(x: number): number`, and in a function type after an arrow, `(x: number) => number`. In Nova it always comes after `->`: `fn f(x int) -> int` and `fn(int) -> int`. So the two arrows have different jobs: `->` introduces the result type, `=>` introduces the expression itself.

![Before → after: function body = → =>, pub fn → export, IO and FS → Io and Fs, result type after -> in both declarations and function types](/blog/2026-10-19-syntax-arguments-with-claude/f7-small-en.png)

Each decision looked reasonable on its own; the mistake was the mix of schools. AI doesn't see it: to the AI these are just different places in the docs.

## A mistake that became a rule

This story goes the other way. In one example, Claude wrote an effect handler as a short lambda. I noticed: "you're assigning a function to an effect, but you said an effect isn't a function." Under Nova's rules at the time, a handler was a value implementing the operations, and the short form was an error. An error, no less, under rules Claude itself had written down when it rejected that shorthand earlier.

But I didn't fix the example. I said: brevity matters, the language should take as few lines as possible, let's reconsider. Claude reweighed, and the rule changed: if an effect has a single operation, its handler can be written as a lambda. The "wrong" example became right. Today it looks like this:

```nova
with Fail[TimeoutError] = |_e| { timed_out.store(true) } {
    // code in which a TimeoutError is handled by the handler above
}
```

Here the persuading went the other way: overturning Claude's own ban. AI applies written rules mechanically and treats them as final. If a rule gets in the way of practice, it's the rule that needs revisiting, and it's the human who has to propose it.

## Five rounds for one line: declaring a method

The longest story: how to write a method declaration. In Go, a receiver is either a value or a pointer, `func (a Account)` and `func (a *Account)`, and there's a lot of confusion around that choice: which receiver to pick, why a pointer method isn't in the method set of the value. In Nova we fought the same thing and ended up removing the choice entirely. The declaration states only the receiver mode: read-only by default, `mut` to modify, and later `consume` was added. How the instance is passed is up to the compiler. But we didn't get there right away. We started with the familiar form:

```nova
fn Account.deposit(mut self, amount money) =>
    self.balance += amount
```

Here `mut self` means the method modifies the instance.

First I proposed writing `@balance` instead of `self.balance`. The idea isn't new: I took it from my earlier language [ObjectScript](https://github.com/unitpoint/objectscript), where `@` also meant the current object, `this`. Claude agreed, thinking it was just sugar. Then I wanted to remove `mut self` from every signature. That's when the objections started, and round after round Claude found a new one:

- an implicit `self` breaks locality: reading the signature, you can't see that the method works on an instance;
- in the variant `fn mut @Account.deposit(...)`, `@` has two different meanings: "type marker" in the signature and "field marker" in the body;
- in the variant `fn Account mut @deposit(...)`, there's no dot between the type and the name, which is inconsistent with paths like `Color.Red`.

Each time I came back with a new form that answered the previous objection. The last one was resolved by the idea of telling the two kinds of functions apart by notation: a static method with a dot, an instance method with a space and `@`:

```nova
fn Account.new(owner str) -> Account => ...        // static method: dot
fn Account @balance() -> money => @balance         // instance method: space and @
fn Account mut @deposit(amount money) =>           // mutating instance method: mut
    @balance += amount
```

The objection about the dot went away, because the notation now reflects the difference between a static method (which often serves as a constructor, like `Account.new`) and an instance method. The `self` keyword was removed from the language; fields are written as `@field`, the instance itself as `@`. Of the five variants this one turned out best, and I'm happy with it.

![Five rounds of the method-declaration argument: each form and Claude's objection to it, with the final notation at the bottom](/blog/2026-10-19-syntax-arguments-with-claude/f2-methods-en.png)

The story has a sequel. When the language got resources that a method takes over completely (`consume`), they found a place right where `mut` goes:

```nova
fn File consume @close()
```

Claude liked this notation even more than I did. It saw two meanings in it. First: `File consume` echoes the generic bound `[T consume]` ("`T` is a resource") and the declaration `type File consume { … }`, so the line says that `File` is a resource type. Second: `consume @` means the method takes the instance, and the file can't be used after `close()`.

A couple of months later it turned out Claude had taken the first meaning too seriously. I noticed that signatures had both `-> ro T` and `-> MutexGuard consume`: the modifier sometimes before the type, sometimes after. The agent proposed fixing the return, but keeping `fn File consume @close()` as a "postfix" that supposedly marks the type. I showed that `consume` here belongs to the receiver `@`, just like in the binding `consume x = …`, and that `File` being a resource is already stated in the type declaration. The agent agreed, but immediately wrote down a rule "the only remaining postfix is in the type declaration", and that had to be corrected again: in `type File consume { … }` the modifier belongs to the type body, like `enum` in `type Shape enum …`. The pretty analogy that Claude liked so much was exactly what led it astray.

In the end there are no postfixes left in the language at all: the modifier `ro`, `mut` or `consume` always comes before what it describes.

And of the three modifiers on a return value, only one survived. `-> mut T` was removed: a returned value belongs to the caller, and what makes it mutable is the binding on the receiving side, `mut x = f()`, not the function signature. `-> consume T` was removed by the same logic: linearity is carried by the type itself, declared as `consume`. But `-> ro T` stayed, because it's a promise by the function that the caller can't override with its binding:

```nova
fn str @bytes() -> ro []u8   // a view of the string's bytes without copying
```

Strings in Nova are immutable, but you can get a string's bytes as an array: `bytes()` returns an `ro` array laid directly over the string's own bytes, with no copy. Without `ro`, such an array could be used to change a string that the language promises never changes. Whoever needs to write makes an explicit copy, for example `"123".bytes().clone()`.

![Return modifiers: -> mut T and -> consume T removed, -> ro T kept](/blog/2026-10-19-syntax-arguments-with-claude/f3-returns-en.png)

## From `let` to `ro`

At first, variables were declared as in Rust: `let x` and `let mut x`. Fields that can't be changed needed their own word, and here Claude first defended the existing rule. It gave in when I showed a real struct where otherwise `mut` would have had to be written 18 times. That's how `readonly` appeared.

Then `readonly` spread to types and parameters, and next to it came `consume x = …`, without any `let` from the start. It got uneven: two kinds of bindings with `let`, one without. In a single day `let` was removed entirely: the word says nothing, the modifier says everything. And `readonly` was shortened to `ro`. The result is a trio of the same shape: `ro x = …`, `mut x = …`, `consume x = …`.

## Kubernetes instead of an argument: field visibility

In early examples, a field was named `@_balance`: the underscore meant "don't touch from outside", as in Python. But that's just a convention; the compiler doesn't check it, and `_balance` is still accessible. The underscore was dropped, and the question came up: what should fields be by default? In Rust, fields are private unless marked `pub`. In Kotlin, properties are public; in Go, visibility is set by the case of the first letter, and case in Nova is already taken by naming conventions.

We settled this one by measuring. We took Kubernetes, a big Go project, and counted fields ([the study](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/dev/research/06-field-visibility-go-kubernetes.md), with the method and the counting script): of 35 thousand fields in 11 thousand structs, 59% turned out to be public. In internal logic it's roughly half and half, while in API descriptions such as `core/v1/types.go`, 92% of fields are public. So in Nova fields are public by default, and you hide a field with an explicit `priv`, which the compiler checks. If almost everything in a type is private, you write `type X priv { … }`, and then open up individual fields.

![Kubernetes: share of public fields — all code 59.4%, pkg/ 47%, staging/ 63.7%, cmd/ 67.8%, core/v1/types.go 92.4%](/blog/2026-10-19-syntax-arguments-with-claude/f6-visibility-en.png)

## Where Claude was right: pointers

Pointers are the only story where the persuading went both ways.

First, what the `mut` in `*mut T` refers to. Claude considered this notation a legacy of C, where the modifier applies to the pointer itself, marked it deprecated and proposed writing `mut * T`. I objected: in `*mut T` the modifier refers to `T`, to what the pointer points to. Whether the pointer itself can be reassigned is decided by the binding, as with any variable. Claude agreed, and it came out as in Rust:

```nova
ro p *mut int   // p can't be reassigned, p.write(1) is allowed
mut q *int      // q can be reassigned, q.write(1) is not, only q.read()
```

A modifier before `*` is now a compile error: two different `mut`s in one type confused everyone, Claude included. The agent later wrote down the lesson itself: "'Two muts' in a type is a smell."

On the second question I was the one persuaded. I proposed that a modifier act on everything to its right, to the end of the type: `ro` before a name would freeze both the pointer and what it points to, and a bare `*T` would inherit mutability from the binding. Claude, together with a separate critic agent, took this model apart and found four serious problems. The main one: the same `*T` would mean "read-only" in one place and "writable" in another, so the type stops being readable without context. A pointer to a pointer becomes a puzzle, and casts and generics need special rules.

This time I was the one who had to look at the question from scratch, which is exactly what I usually ask the agent to do. I looked at my idea from the outside, and Claude's argument convinced me. Now a modifier stops at the `*` boundary: `ro` freezes everything the value owns but doesn't pass through a pointer. What you can do with the memory behind a pointer is said only by its type: `*T` means "read-only", `*mut T` means "writable", the same everywhere in the program. In a garbage-collected language without borrow checking, you can't statically tell your own memory from someone else's, so the boundary is drawn where it's visible in the text: at `*`. The price is known from C++: deep immutability can't be imposed through a pointer from the outside.

![ro freezes everything the value owns but stops at *: what you can do behind a pointer is said only by its type](/blog/2026-10-19-syntax-arguments-with-claude/f4-pointers-en.png)

## When to argue with AI: a short checklist

1. **The AI defends a decision because it's already written down.** A concrete real-world precedent outweighs a week of accumulated rationale. Ask for the decision to be reconsidered from scratch.
2. **The AI says "it's logical".** Ask how it reads. An argument from the eye can matter more than a logical one.
3. **A piece of a big cancelled system is left in the design.** Check it separately: the AI will keep it simply because it was in the docs.
4. **Terms or conventions from different languages.** Ask what the model was. The AI doesn't see a mix of schools.
5. **The AI rejects an idea by citing a rule.** If the rule gets in the way of practice, revisit the rule.
6. **Objections come in a cascade.** Don't give up after the first "no": find out what exactly is in the way and propose another form.
7. **The AI shows where your idea breaks.** If these are concrete examples, agree.

## What came of it

All the decisions from these stories live in the language: Nova now has alpha releases of two compilers, and the second one, written in Nova itself, built itself. There's [a separate article](/blog/2026-10-16-ai-compiler-self-build/) about that. Every decision is recorded in the [specification](https://github.com/nv-lang/nova/tree/main/spec/decisions) along with its rationale, and the habit of arguing with AI described above hasn't gone anywhere.

## What AI does well

So this doesn't read as a takedown. Claude keeps dozens of pages of decisions in mind at once and cites things I forgot long ago. It notices right away when a new decision contradicts an old one. It proposes options with pros and cons. And above all, it makes sweeping edits: when one decision changes, it updates thirty files and explains each change. Without that, the specification wouldn't have over three hundred decisions that agree with each other.

That's how we split the work: the AI writes and remembers, and I argue. A lot of Nova looks the way it does because the AI wanted to add something and I didn't let it. And some of it because it didn't let me.

Have you had an AI stubbornly defend a decision that later turned out to be wrong? How did you change its mind?

Repository: [github.com/nv-lang/nova](https://github.com/nv-lang/nova), [the specification as a decision log](https://github.com/nv-lang/nova/tree/main/spec/decisions).

---

*Originally published in Russian on Habr: [habr.com/ru/articles/1096408](https://habr.com/ru/articles/1096408/).*
