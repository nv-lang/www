---
title: "Can You Build a Programming Language with AI? Nova's First Compiler Hit a Dead End, the Second One Built Itself"
description: "Five and a half months of building Nova with AI agents: why the first compiler, Oracle in Rust, hit a dead end, how the second, Carina written in Nova itself, built itself byte for byte, and seven techniques for checking agents' work."
slug: "2026-10-16-ai-compiler-self-build"
date: "2026-10-16"
dateLabel: "October 16, 2026"
lang: "en"
tags: ["Article", "AI agents", "Compiler"]
cover: "/blog/2026-10-16-ai-compiler-self-build/cover-en.png"
excerpt: "Nova's first compiler, Oracle in Rust, hit a dead end: for a month the agents and I \"fixed\" type inference, the reports were green, and the work stood still. The second, Carina, was written from scratch in Nova itself and built itself, byte for byte. How it went, step by step, and seven techniques for checking agents' work."
---

Hi everyone!

I have been writing the [Nova](https://nv-lang.org/) language with AI agents for five and a half months. Nova is a Go/Rust-like language for backends and server programs where a function declares in its type, in plain text, what it does on its own. For example, it works with the network, the clock, the file system and so on. In Nova these are called effects (the idea comes from Koka, Eff, OCaml 5). Effects can be swapped at runtime and send the program down a different execution path. That is why Nova does not need mocking engines or testing frameworks: the implementation is simply replaced with a test one through effects, and the program itself stays unchanged. I am trying to bring the effect system to a practical state. At the moment the language has two compilers: Nova Oracle (in Rust) and Nova Carina (in Nova itself). The [language specification](https://github.com/nv-lang/nova/tree/eee6eae882a46861d70e5eae48648d8a643c8901/spec) is written as a [log of design decisions](https://github.com/nv-lang/nova/tree/eee6eae882a46861d70e5eae48648d8a643c8901/spec/decisions), each with a rationale: there are more than 300 of them. More than a dozen further documents describe development conventions.

I'll start with the episode after which Oracle (I'll explain the name later in the article), Nova's first compiler, hit a dead end. Over the summer the agents and I were "fixing" how expression types are determined. Over time the agents had created several parallel implementations of the same thing, and an expression's type was computed twice: in type checking (the checker from here on) and once more in the code generator, as a fallback branch (fallback inference from here on). Starting July 11, the agents and I spent a month reconciling these two inferences, trying to bring everything down to a single "door", that is, a single implementation: I planned to delete the fallback as soon as everything had moved into the checker and worked identically. Almost everything matched, but the fallback inference did not get any smaller. Tests passed, reports were green, I took the reconciliation for progress, and in reality that month stood still on this topic. One of the main problems with today's agents is getting them to do our tasks in a controlled way.

So can you design and write a new language with AI? Yes, up to alpha and self-build it has already been proven: the second compiler, Nova Carina, did build itself from its own sources! For me this is a significant achievement. As for ending up with a stable and powerful compiler, that work and those conclusions are still ahead. The first copy of Nova from Nova sources was built by the Oracle compiler. Then the resulting compiler built itself from its own sources, and that is the self-build.

Nova Oracle turned out to be a transitional alpha: it implements the Nova language specification fairly well, and it compiles the whole standard library, the add-on packages, the examples and real applications. Carina is also built with it. Right now I only fix things in Oracle that block a full Carina release, since Carina can currently do syntax checking, type checking and C generation. Oracle also outputs C sources, which are compiled (with clang and so on) into an executable.

Next: how it went, step by step. At the end: seven techniques for checking agents' work that I drew from this, and how to try Nova yourself.

![Nova project timeline, May to October 11](/blog/2026-10-16-ai-compiler-self-build/p01-timeline.png)

*Figures in this article are in Russian; captions below them describe what they show.*

## Who is who and how I work with agents

- **Oracle and Carina.** Oracle is the transitional alpha, the builder of Carina and the reference (the source of expected answers that Carina is checked against). Carina is the second compiler, written from scratch in Nova itself: it is not a translation of Oracle's Rust code but a new architecture. I started Carina on August 14. On October 11, 2026, the alpha releases Oracle 0.1.0 and Carina 0.2.0 came out.
- **Agents and acceptance.** I write Nova on personal accounts: agents work in several parallel sessions, and one of them, the integrator agent, merges the work of the others. I define what counts as a completed task and read the code selectively. I collect the acceptance rules into a [public methodology](https://github.com/unitcraft/ai-dev-methodology) (texts under CC BY 4.0, scripts under Apache-2.0 or MIT).
- **Scale and cost.** Since May (five months): about 19 thousand commits, more than 300 thousand lines of Rust in [Oracle](https://github.com/nv-lang/nova/tree/oracle-v0.1.0) (most of it is the [compiler](https://github.com/nv-lang/nova/tree/oracle-v0.1.0/compiler-codegen)), about 64 thousand lines of Nova in [Carina's sources](https://github.com/nv-lang/nova/tree/carina-v0.2.0/novac) and about 16 thousand in its [test fixtures](https://github.com/nv-lang/nova/tree/carina-v0.2.0/novac/fixtures). The [standard library `std`](https://github.com/nv-lang/nova/tree/eee6eae882a46861d70e5eae48648d8a643c8901/std/src) in Nova is about the same size as Carina itself: about 65 thousand lines (of which about 17.5 thousand are tests). Eight published packages ([HTTP](https://github.com/nv-lang/nova-http), [TLS](https://github.com/nv-lang/nova-tls), [Polaris](https://github.com/nv-lang/nova-polaris), [compression](https://github.com/nv-lang/nova-compress), [DuckDB](https://github.com/nv-lang/nova-duckdb), [PostgreSQL](https://github.com/nv-lang/nova-postgres), [arbitrary-precision numbers](https://github.com/nv-lang/nova-bignum), [SOCKS](https://github.com/nv-lang/nova-socks)): another roughly 43 thousand lines at the latest tags. In total, about 190 thousand lines of Nova including tests. About 160,000 rubles on subscriptions over the whole period (roughly 30,000 a month); almost all the time the main agent was Claude Code, in several parallel sessions on non-overlapping tasks. I have only one Claude Code account, and that seriously limits speed: with several accounts you can do much more or do it faster. But this is a passion project, so I work from my one account. Recently I also added Codex and Kimi Code, and they handle the work well too. I did not count my own time.

About the names. Carina is the keel of the ship Argo, and "Nova Carinae" is the designation for novae in the constellation Carina (why exactly this name was chosen is recorded in the [naming conventions](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/dev/naming-conventions.md)). The name Oracle was invented by the agents; I noticed it in their exchanges. They called the base compiler the Oracle because they went to it to check Carina's results. I found that rather interesting and decided to keep the name Oracle.

## What Nova looks like and what it is for

Nova is quite similar to "Go with effects": what a function itself does to the outside world is visible in its type. Some effects are built into the stdlib (for example, `Net`, `Time`), and users can add their own effects (for example, `Counter`, `Emit`). Nova compiles to C and then to a native binary, with no virtual machine; there is a garbage collector. Nova's purpose is backends and server programs; the Polaris HTTP framework has already been written for it (more below).

Here is the signature of a public function from the demo aggregator, from [`aggregate.nv`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/flagship/aggregator/src/app/aggregate.nv) (line 113; the body in `{ … }` is omitted):

```nova
export fn aggregate(sources []Source, budget Duration) Net Time Emit -> Report { … }
```

`export` makes the function public, `[]Source` denotes an array, and `Net Time Emit` between the parameters and the arrow sets the effects (`Emit` is the [aggregator's own effect](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/flagship/aggregator/src/app/emit.nv#L18): progress events for a live UI, such as "request started", "finished", "cancelled"). A public function must declare the effects it uses itself: if it reads the clock and `Time` is not in its type, that is a compile error.

How concurrency, effects and resources work in Nova is shown at the end, in the section ["How to try Nova"](#try).

## 68 thousand lines in one file: how the fallback type inference came about

Oracle grew task by task: an agent writes a plan, code and tests, and I check the result. The compiler architecture written by the agents turned out, well, let's say it didn't turn out (that happens without AI too; I'll say up front that getting agents to write to a clearly defined architecture is quite a challenge), and by the release the C code generator (the part that translates the program into C) had become a single file of about 70 thousand lines. I built strong generics support into Nova, and computing type monomorphization takes a great deal of code.

I had to find out why the compiler made mistakes in similar places. The checker determined a type and wrote it to a table. The C generator read the table, and if there was no entry, it determined the type again, with its own logic. That is the fallback inference.

![The C generator reads types from the checker's table or infers them itself](/blog/2026-10-16-ai-compiler-self-build/p02-fallback.png)

Each such fix looked reasonable on its own. The fallback inference grew to several thousand lines in two functions, and hundreds of places relied on it. When the two inferences disagreed, the compiler could silently call a method of the wrong type: the program built, there was no error, but it behaved incorrectly.

That is how the ["One Truth" plan](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/196-one-truth-closeout.md) came about: complete the checker's table and remove the fallback inference from the generator.

## I accepted progress reports, and the fallback inference only grew

The checker was extended with new logic (expanding the type table). At first it runs in shadow mode: it computes the same thing, compares its answer with the fallback inference and throws its own answer away, while the fallback inference still does the real work. When the answers match everywhere, the fallback inference is removed. The agents and I worked like this for about a month: the plan was created on July 11, and I started Carina on August 14 (≈34 days).

**For a month I took matching answers for movement toward the goal, when it was only a check that the new code did not break anything.**

The new logic handled the easy cases, but on the hard ones, with generic types, it answered "don't know". That did not count as a mismatch, so the reconciliation showed a match almost everywhere, while the hard cases were still decided by the fallback inference. There was no counter of removed code.

Then the agents and I admitted this and went back to direct work: completing the table and removing the branches of the fallback inference one by one. A counter appeared: every stage had to shrink the fallback inference. It measured one of the two functions, `infer_call_ret_c`. That one did shrink, but the second, `infer_expr_c_type`, grew over the same period (the first measurement in the table is from July 12):

| | July 12 | release |
|---|---|---|
| `infer_call_ret_c`, lines | ≈2590 | ≈2380 |
| `infer_expr_c_type`, lines | ≈2340 | ≈2820 |
| combined | ≈4.9 thousand | ≈5.2 thousand |
| calls to `infer_expr_c_type` in `emit_c.rs` | 229 | 242 |

The total barely changed: ≈4.9 → ≈5.2 thousand lines, so it actually increased (counted from git: commit `b7a45bf` from July 12 and the release revision `eee6eae`; lines between the functions' curly braces).

![One function shrank, the other grew, the total did not shrink](/blog/2026-10-16-ai-compiler-self-build/p03-two-functions.png)

The counter looked at only one of the two functions, so it showed no progress. The agents and I never finished the rework, so silent errors of this class are possible in Oracle, and that is one of the reasons it is an alpha. The tests showed whether behavior had changed, but they could not say how much of the fallback inference had been removed.

### 36 blocker defects left before release. Then 62

A blocker is a known defect that kept me from releasing Oracle 0.1.0 until it was fixed. I tracked them in the [release plan](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/221-release-v0-1.md). Weekly measurements up to the pause on September 9 (the number of blockers is counted by a project script from the defect registry):

**67 → 36 → 44 → 62.**

![Defect registry and blockers by week. Total entries: 687, 715, 824, 1020; closed: 259, 300, 359, 441; open: 428, 415, 465, 579; blockers: 67, 36, 44, 62](/blog/2026-10-16-ai-compiler-self-build/p04-blockers.png)

In the first week the number of blockers almost halved: those were real fixes, and that week more were closed than found. After that, defects were found faster than they were closed. For example, on September 8–9 we found that in some situations the compiler silently lost part of the project settings. This class of error is very hard to catch. The blockers found were mostly old ones, but the agents and I only now started finding them in batches; dozens of blockers could be closed in a day, while even more were added among the new finds, and under those conditions the distance to the release, of course, only grew.

In the three weeks before the pause, 333 entries were added to the registry and 182 were closed. The [defect registry](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/221.1-bug-sweep.md) holds every defect found, of any severity, closed ones included; by October it had accumulated 1789 entries. Blockers are only a small part of the registry, so the numbers 62 and 1789 cannot be compared.

## I started the second attempt with rules that the machine checks

I made the decision about Carina in a design session on August 13 ([plan 274](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/274-novac-self-hosted-compiler.md), added on August 13, [commit 0d1505c](https://github.com/nv-lang/nova/commit/0d1505cf1)), and work started on August 14. As I said earlier, defects were being found faster than they were fixed, and the reason was the design of the Oracle compiler. So I set the goal right away: the new compiler had to be built on a well-thought-out architecture, be stable and conform to the language specification. The second goal: to be as fast as possible, which I spelled out in an entry on September 11. Go's level is probably out of reach: the scale of development is not comparable, and generics complicate the compiler and increase compile time significantly (registry entry #640: seven lines of source produce 285 KB of C and 444 function bodies because of full monomorphization). This is a goal, not a promise. Fixing everything would have meant rewriting everything, that is, writing a new compiler in Rust? In my words at the time, the funnel was not converging and there was no positive trend. By then the fallback inference had already been patched point by point several times (plan 196.7 closed on July 15 incomplete; entry #696 from August 16). All of this together led me to the idea of no longer patching what could not be fully patched: on August 16, in plan 196, I banned any further point patches. I decided to write the compiler from scratch, directly in Nova. That is a serious challenge, and at the same time a chance to polish Nova right away on a large project where its resilience can be tested.

I set aside the first month of work on Carina to find out whether the idea was viable: plan 274 names day 30 as the point of reassessment. For almost another month I tried to stabilize the Oracle release in parallel with developing Carina. On September 9 I put its release on pause, and on September 15 I decided that Carina would be released directly. Before the release I revised this: Oracle came out as an alpha, with no stability promise, because for now it is the only thing that builds Carina.

From day one the agents and I worked out the architecture using other compilers as models: in the plan they are called donors. From rustc we took type inference inside a function body and the traversal of generic instances; from Go, type matching at a generic call and instance generation (plus the early Go compiler written in C as a model for some decisions); from Roslyn, a lossless parse tree; from Zig and Carbon, indices for tree nodes. Only the checker is allowed to write an expression's type; the other parts read its answer. CI (automatic checks on the server on every build) looks for calls to the type-writing and type-inference functions outside the checker, by the names of the type-inference functions. The allowed dependencies between modules are written in a rules file, and CI checks that too. In Oracle I caught these by eye and, of course, unsuccessfully. For myself, I have concluded this for now: a rule that is only written down will sooner or later be broken by agents in a large project. Only what the machine checks on every build holds: architecture, procedures, conventions. How to achieve that is a topic for a separate discussion.

![Carina pipeline: lex, parse·tree, names, check, lower, mono, emit_c with donors; only check writes the type table, the rest read it; CI on every build checks for type writes outside check and module dependencies against the rules file](/blog/2026-10-16-ai-compiler-self-build/p12-carina-architecture.png)

More details: [Carina's architecture document](https://github.com/nv-lang/nova/blob/carina-v0.2.0/docs/dev/novac-architecture.md) with a table of layers and donors.

### The test passed because it checked only integers

Since August 30 the project has had defect hunters: separate agents that are assigned a module and a class of defects. A hunter searches by probing, fixes nothing and hands in a report, and the findings go into the registry. By the Oracle release the hunters had found 202 registry entries ([agent definition](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/.claude/agents/defect-hunter.md)).

On September 5 a hunter was checking Carina's C generator ([report](https://github.com/nv-lang/nova/commit/3712c9894)) and, among other things, noted that the generator silently turned everything that was not a string into an integer (an agent's unilateral decision), while the test was green, since it checked only integers. This is a very common pattern in how agents work: find a hole in the approach and push everything through it, whether it should go there or not.

Type checking let only strings and integers into string interpolation `"${expr}"`, even though from the start I had insistently asked the agents to work without simplifications, since I had run into this a million times already, and fixing simplifications later is a separate headache, given how many there are in a large project and how incompletely they get recorded (agents can cut corners here too). But the agents found that the tests checked only integer types and started slapping integers everywhere, even where the types were not integers. By the specification you can interpolate floats, booleans, `Option` and any type that converts to a string. This is a latent divergence from the specification: the agent narrowed the implementation down to a convenient solution. After reading the report, I asked what I should have asked right away:

**is such narrowing allowed at all by the specification and our agreements?**

![Three layers understand interpolation differently; the test checked only integers](/blog/2026-10-16-ai-compiler-self-build/p05-interpolation.png)

After that I made it a rule: implement strictly according to the specification. If something is not done yet, the compiler must say plainly "not supported yet", and the gap must be recorded in the registry or a plan. Silently doing less than the specification requires is not allowed: such a task does not count as done, especially since tests will not catch it.

### The reference is wrong too: 25 workarounds for Oracle bugs in Carina's sources (mid-September)

When writing a new compiler it is convenient to feed it the same program as Oracle and compare the results. That is how new Oracle defects were found. Carrying defects over into the new compiler would have meant carrying over errors, so in disputed cases the Nova language specification decided.

Sometimes an Oracle bug has to be worked around in Carina's own sources, otherwise the tool used to build it will not build it. The plan calls this accounting of workarounds the "oracle tax". By September 16 Carina's sources had 25 workarounds for six Oracle bugs in 18 files (marked `LEGACY-#N` with a reference to the registry entry). A workaround used a different language construct that compiled correctly. By the Carina release all six bugs had been fixed in Oracle itself and the workarounds removed: the last ones were taken out on September 30.

The same markers also appear on two more entries, but those are not Oracle bugs: [#700](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/221.1-bug-sweep.md?plain=1#L1063) is Carina's own debt (on an error in a program it may still crash with an internal error instead of a clear message), and [#708](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/221.1-bug-sweep.md?plain=1#L1071) is an unfinished part of the language runtime: by the specification the failure handler should receive an error record with fields, but that is not implemented yet, so for now Carina parses the text of the error message. They remained in the release.

![Workarounds for Oracle bugs in Carina's sources: on September 16, 25 workarounds for six bugs in 18 files, 0 by the release; markers #700 and #708 are not about Oracle and remained](/blog/2026-10-16-ai-compiler-self-build/p06-workarounds.png)

## "CI is green, except the known red": nothing ran after the red step

On September 20 the integrator agent started looking into what exactly runs on CI and discovered that the compiler's unit tests were not running. Before them, the project-conventions check step was failing, and everything after it was skipped. Both the agents and I considered this red step a known problem and left it alone, and from the outside the skipped tests looked the same as passed ones. They had not been running since at least September 16. I was counting on a safety net that, as it turned out, was not there. Why did we only catch it on September 20? I have only one Claude Code account, and its limit is only enough for the main tasks: I was spending it on developing Carina and on the release. There was no limit left for a separate agent to deal with CI itself, as with many other issues in Nova's development.

![The red conventions step, all the following steps skipped](/blog/2026-10-16-ai-compiler-self-build/p07a-red-step.png)

On September 20 the red step stopped failing, and CI finally ran Carina's unit tests ([run](https://github.com/nv-lang/nova/actions/runs/35543439749)): they passed, 27 files out of 27.

![The conventions step passed, the build passed, unit tests: 27 of 27](/blog/2026-10-16-ai-compiler-self-build/p07b-reached-tests.png)

In those same days Carina started checking its own sources with the `check` command (checking without code generation) per whole module rather than per file. The number of diagnostics dropped:

**1216 → 332** (by September 20).

The difference of 884 is not fixed bugs. Previously each file was checked separately and did not know what was declared in neighboring files, and most of the messages were false alarms because of that. Once the check was run on the whole module, those messages went away by themselves.

![check diagnostics: 1216, 332](/blog/2026-10-16-ai-compiler-self-build/p08-diagnostics.png)

One more check behaved differently depending on the environment: on October 3 it came out that with CRLF one file stopped parsing, while another, with an unsupported construct, was accepted: the result of the check depended on line endings. It was fixed the same day, in the lexer.

## Carina built itself twice, and the results matched byte for byte

Carina 0.2.0 on Windows x86_64 built itself twice: both the C code and the executables matched byte for byte (with deterministic linking; the C code was compiled into a binary by a separate script, since Carina does not have a build command yet). This is self-build in its basic form. The self-build was recorded on the evening of October 10, 2026: the run I watched started around 19:35 UTC, and the byte-for-byte match is recorded in the acceptance log. A separate [CI run on commit 99756a8](https://github.com/nv-lang/nova/actions/runs/38080300506) finished successfully the same evening, but by itself it does not prove the byte-for-byte match. Less than two months had passed since work started on August 14.

After the story with the skipped tests, I needed an answer to the question: how do you know the check itself is not lying? The comparison was tested in the opposite direction:

**one changed byte in the generated C or in the executable must produce "does not match" with the byte number.**

One byte was changed in a copy of the file, and the comparison reported "does not match" at exactly that byte. After the byte was restored, it reported "matches" again.

How the chain works. **A** is Carina built by Oracle. **A** translates Carina's sources into C code, and clang builds the executable **B** from it. Then **B** does the same with the same sources and gets **B′**.

```text
Oracle                        → A
A (Carina sources) → C code₁ → clang → B
B (Carina sources) → C code₂ → clang → B′
check: C code₁ = C code₂ and B = B′, byte for byte
```

*A is the first generation (built by Oracle), B the second, B′ the third. A ≠ B is acceptable: C code₁ must match C code₂, and B must match B′. (In the acceptance log, which records the self-build checks attached to the Carina 0.2.0 release, the third copy B′ is called C.)*

![Oracle builds Carina A, Carina A builds Carina B, Carina B builds Carina B′ from the same Nova source; the C code and the B and B′ files match](/blog/2026-10-16-ai-compiler-self-build/p09-self-build.png)

Deterministic linking is needed because by default the linker writes the build time and the file name into the executable: otherwise the files cannot be compared. So it is turned on, and B and B′ are linked under the same name in different directories.

The C code itself is the same for Carina built by Oracle and for Carina built by Carina, from the same sources (apart from the shared Oracle snapshot).

Identical copies do not prove the language is correct. There are three caveats:

1. **Carina was not built from nothing.** The specification, the standard library and the runtime already existed, and Oracle served as both the builder and the reference. Carina's sources are written in a subset it understands; of the project's examples (118 files), as of October 10 it accepts 66, and in 61 of them the behavior matched the Oracle-built version (per the [CI log](https://github.com/nv-lang/nova/actions/runs/38080300506) on Carina's commit); another 43 it cannot accept yet. The same error can survive in both copies: semantics need their own tests.
2. **About 12% of the C is a ready-made Oracle snapshot.** That is ≈1.5 of 13.25 MB: service tables and the used parts of the standard library, pre-generated by Oracle. The match between B and B′ covers the program's code plus this shared snapshot. Compiling the standard library with Carina itself is still to come.
3. **The first copy was built by an internal Oracle build, not by the published archive.** The acceptance log ([Carina 0.2.0 release](https://github.com/nv-lang/nova/releases/tag/carina-v0.2.0), where the saved B is also kept) recorded only the hash of that build. So the chain was separately repeated with the published Oracle 0.1.0 archive: A was built by its release `nova.exe`, and B and B′ (the receipt calls the second one C) matched byte for byte (3 874 304 bytes), as did the C files (13 250 302 bytes). This is the replacement [release receipt](https://github.com/nv-lang/nova/releases/tag/carina-v0.2.0); its numbers differ from the original acceptance because it is a separate run. The original acceptance still ran on the internal build.

Carina can so far only do `check` and `emit` (checking and C generation), there is no Linux binary in 0.2.0, and building all packages and examples is part of the release criteria for 0.3. [Carina's sources](https://github.com/nv-lang/nova/tree/carina-v0.2.0/novac) are open. The goal for 0.3 is for Carina to build and run all examples and packages by itself, with the checks and CI passing on a single commit. If Carina diverges from Oracle, we go by the Nova specification.

## Seven agent attempts and the "30 out of 30" acceptance threshold

A digression back to May: the same "almost works" happened earlier. On May 31 and June 1 an agent tried seven times in a row to fix a race in the runtime with the fiber scheduler (fibers are lightweight threads, like goroutines in Go; about 10 hours of agent work across six sessions; [`debugging-races.md`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/dev/debugging-races.md) and [plan 83.11](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/plans/83.11-centralized-io-driver.md), §12.13–12.26; I numbered the attempts in the table in order). Each one gave "almost works". The reproduction: in a block with a cancellation token (an object used to stop a group of tasks), a task launched inside cancels that same token, and the program sometimes crashes. How many stress-test runs out of 30 succeeded:

| # | What was tried | Successful runs out of 30 |
|---|---|---|
| 1 | swap the order of two writes in the cancellation token: first the reason, then the "cancelled" flag | 4 |
| 2 | pin the cancellation token in memory so the garbage collector would not remove it | 1 |
| 3 | work around the problem directly in the generated code, for cancellation without a reason | 25 (but the cancellation reason was returned incorrectly: behavior broken) |
| 4 | four different ways of storing the cancellation reason (a string) in memory | 7, 25, 5, 5 |
| 5 | disable the garbage collector during cancellation | 19 (+4 tests timed out in the full suite) |
| 6 | register each fiber's stack with the garbage collector | 21 (+726 tests timed out) |
| 7 | tell the garbage collector about the running fiber's stack | 13 |

The acceptance threshold is strict: the stress test must pass 30 out of 30, all seven attempts failed it and were rolled back. An eighth attempt was not needed: diagnostics helped. On Windows a handler was installed inside the process that prints the call stack on a memory crash, and the cause became visible on the first run: the queue on the stack had already been freed (use-after-free). The fix ([commit bf1b45a](https://github.com/nv-lang/nova/commit/bf1b45a4f)) took about 30 minutes after 10 hours of unsuccessful attempts, and the stress test passed 30 out of 30. This is the only case I know of where the acceptance threshold made the difference, and it comes from the runtime, not the compiler, so the conclusion rests on a single case.

![Seven attempts to fix the race: successful stress-test runs out of 30, threshold 30 out of 30](/blog/2026-10-16-ai-compiler-self-build/p10-seven-attempts.png)

## So can you?

Up to alpha and self-build, yes. In five months (cost and time are given above) the result is an alpha of the language with a standard library on which small programs build (the packages are separate and were not part of release acceptance; Oracle has known silent code generation errors), and a second compiler in Nova itself that has passed self-build. Up to a stable compiler, I don't know yet: the first attempt ran into its architecture, and the second, Carina, has reached alpha and self-build, but its road to a stable version is still ahead.

Both sides made mistakes. The agent substituted the task or passed off "almost works" as done. I took green reports for progress. From these episodes I drew seven techniques:

1. Measure the removal of the fallback inference, not progress reports (the month of reconciliation: by the reports there was progress, while the fallback inference grew from ≈4.9 to ≈5.2 thousand lines).
2. Count the distance to the goal, not the number of closed defects (blockers: 67 → 36 → 44 → 62, found faster than closed).
3. Check the implementation against the specification even when the test is green (interpolation `"${expr}"`: the generator silently made an integer out of everything that was not a string).
4. Check that the tests actually run on CI at all ("CI is green, except the known red": the unit tests had not been running since at least September 16 because of a red step before them).
5. Check the check itself (self-build: a corrupted byte must produce "does not match" with the byte number).
6. Set a strict acceptance threshold that does not let "almost works" through (seven attempts to fix a race in the runtime, each "almost works"; the threshold rests on a single case from the runtime).
7. When the threshold is red, diagnostics first, new attempts later (after seven attempts the cause was revealed by diagnostics: about 30 minutes versus about 10 hours).

Some of this would have happened with people too. With agents, I think, something of its own is added: there is more code than I can read, and reports turn green even without progress. My checks caught breakage, but only a human or another agent noticed when the task had been substituted. So to the question "did the tests pass?" I added two more: what exactly did they check, and what change would make them fail. The answer has to be a repeatable check: a counter of removed code (it counts both functions and the number of calls) and deliberate corruption of a file that the comparison is required to catch.

If you run a large project with agents: has it happened that an agent's task was done just to tick the box, the tests were green, but the needed result was not there? What check did you add after that?

<a id="try"></a>

## How to try Nova

Here: how to run Nova yourself, what to watch out for, a short tour of the language, and links.

Both compilers translate Nova into C, and the binary is built by a C compiler. Carina so far only checks and generates C, so the language is best tried on Oracle: archives for Windows and Linux x86_64, the `nova` CLI with `check`, `build`, `test`, a linter and a language server.

### Build your first program

There is a standard library and separate packages in the [nv-lang organization](https://github.com/nv-lang) (HTTP, TLS, Polaris, compression, DuckDB, PostgreSQL and others). The packages are not included in the Oracle archives and did not go through release acceptance. The [full demo aggregator](https://github.com/nv-lang/nova/tree/eee6eae882a46861d70e5eae48648d8a643c8901/examples/flagship/aggregator) runs on Polaris, the web framework for Nova.

Download `nova-oracle-0.1.0-windows-x86_64.zip` from the [Oracle page](https://github.com/nv-lang/nova/releases/tag/oracle-v0.1.0) and verify it against `SHA256SUMS` from the same release. You need MSVC Build Tools (the SDK and the linker; clang needs them too). If clang is installed (`winget install LLVM.LLVM`), nova will pick it first. Unpack the archive and open PowerShell in the directory with `nova.exe`:

```powershell
. .\setup-env.ps1
nova --version
```

The dot at the start of the command (dot-sourcing) keeps the environment variables in the current session. In a separate folder, create `nova.toml` (`[package]`, `name = "hello"`, `version = "0.1.0"`) and `hello.nv`; the module name must match the package name:

```nova
module hello

fn main() {
    println("Hello, Nova!")
}
```

In the same session, from the project folder, run `nova build hello.nv` and `.\hello.exe`. Expected output: `Hello, Nova!`.

These steps on Windows are automatically checked in CI on the built zip ([run 38131440529](https://github.com/nv-lang/nova/actions/runs/38131440529): unpacking, `nova build hello.nv`, running `hello.exe` prints "Hello, Nova!"). That is a GitHub runner, not a clean user machine. I checked all the code examples in this article on the same archive. For Linux there is the `nova-oracle-0.1.0-linux-x86_64.tar.gz` archive; installation is described in `README-INSTALL.md`.

How I write Nova with an agent: I open the cloned repository and say "read the project", and after that the agent can already write Nova. This is with my agents, and quality varies between agents, but even the free agent [OpenCode](https://opencode.ai) with the [Big Pickle](https://opencode.ai/docs/zen/) model writes Nova: it wrote the BigInt core in the [nova-bignum](https://github.com/nv-lang/nova-bignum) package (arbitrary-precision integers: a sign and an array of 32-bit words, addition, subtraction, comparison; 302 lines of module and about 200 lines of tests) in the [package's first commit](https://github.com/nv-lang/nova-bignum/commit/b58be34) on July 29, and the tests passed. Of the seven free models I tried on Nova tasks, two turned out to be usable; the selection results are recorded in the [runbook](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/docs/dev/opencode-runbook.md).

### What to know before your first experiment

- Both releases are alphas: the language and the API may change. Carina binaries exist only for Windows x86_64.
- Oracle can silently generate wrong code (see the part about fallback inference): check behavior with tests.
- A known failure: a string literal passed to a `[]u8` parameter of an overloaded function does not build (registry entry #1594); workaround: an explicit `.bytes()`. A separate entry, #1850: the `std/src/os` module does not build under MSVC (error C2099).
- Data races are not fully checked (see ["Resources, data races, generics"](#resources) below).
- `requires`/`ensures` contracts are checked at runtime. Static proof is enabled with the `--verify` flag, but in the prebuilt archives it handles only simple cases (obvious tautologies, constant evaluation). Oracle does have a full Z3 solver, but it is enabled when building from source (`cargo build --release --features z3-backend`) and is not included in the archives.
- Contracts are checked in release builds too: on the published archive, a program with a violated `requires` in `release` mode also exits with an error (code 101). By the specification (D421), only contracts marked `#debug` are stripped.

It is too early to take this to production, but for a small experiment, with behavior checked by tests, it is already enough.

### A little about the language

Here is only what is needed for the article's examples; the full syntax is described in the [specification on the website](https://nv-lang.org/spec/decisions/syntax/).

#### Concurrency: requests with a deadline

Concurrency is structured: parallel tasks are launched inside a block, and the block does not finish until all of them have finished or been cancelled, so nothing is left running in the background after leaving the block. There is no async/await, because that colors the whole call tree Async at once. Instead Nova is built on the M:N model: as in Go, there are fibers (lightweight threads, like goroutines), M of them, and the scheduler distributes them across N system threads and moves work between threads when needed. Each thread does I/O through its own libuv event loop. Functions are not split into synchronous and asynchronous.

Four lines from [`examples/mini_aggregator.nv`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/mini_aggregator.nv), lines 49–52:

```nova
fn fan_out(latencies []int, deadline Monotonic) Time -> []str =>
    parallel for ms in latencies {
        probe(ms, deadline)
    }
```

`parallel for` runs the iterations concurrently in separate fibers and collects the results, here into `[]str`; cancellation by deadline is built into the language itself. Types are written after names, as in Go; `->` is the result type, `=>` is a single-expression body; the other body form is a `{ … }` block, and the block's value is its last expression (like `a + b + c` below). `Time` between `)` and `->` is an effect (the clock), like `Net Time Emit` in the `aggregate` signature at the start of the article; `Monotonic` in the parentheses is an ordinary type: monotonic time, and `deadline` is the moment of cancellation. `Future` and `await` are not needed: instead of `async`, the M:N model is used.

Late requests are cancelled by the deadline (structured concurrency, as in Kotlin and Trio). The cancellation itself is in `probe`, from the same file, lines 30–37 (`timed_out`, an atomic flag, and the `tx`/`rx` channel are declared earlier in the function):

```nova
with Fail[TimeoutError] = |_e| { timed_out.store(true) } { // catch the error through an effect
    supervised(deadline: deadline) { // turn on a supervisor with a deadline (this is optional),
                                     // the supervisor waits until all fibers inside finish
                                     // or, as in this case, are cancelled by the deadline
        spawn { // launch a fiber
            latency_ms.to_millis().sleep() // in this case just sleep for a given number of ms
            ro _ = tx.try_send(true) // write the result to the channel
        }
    }
}
```

`supervised(deadline: …)` limits the block in time: when the deadline expires, the child tasks are cancelled, and `with Fail[TimeoutError] = |_e| { … } { … }` catches this as an error and sets the flag (`with X = |e| { … }` is the short form of a handler for `Fail`: `|_e|` receives the error, the curly braces hold the reaction, followed by the block the handler applies to). `ro` declares an immutable variable; `ro _ = …` means the result of the call is deliberately unused.

![Web UI of the demo aggregator: a frame from the recording, the parallel polling block](/blog/2026-10-16-ai-compiler-self-build/aggregator-demo-frame50.png)

*This is an example of concurrent work with HTTP requests. What you see: a green bar means the request made it, red means an error, gray means cancelled by the deadline. Moscow, Saint Petersburg, Novosibirsk and London made it, New York is an error, Tokyo was cancelled by the 2 s deadline. The demo is deterministic (`mock_net`, not a live network). The grid of small squares under the bars is the rest of the requests in the same batch beyond the six cities, one square per request; it is cropped in the frame. [See it in motion](https://raw.githubusercontent.com/nv-lang/nova/eee6eae882a46861d70e5eae48648d8a643c8901/docs/assets/aggregator-demo.gif) (GIF, 4.75 MB).*

<sub>Recorded on August 2, 2026; the current version is different. The signature in the header differs from the repository at this revision (`aggregate` at the start of the article); the scenario is a weather one, not `mini_aggregator.nv` above.</sub>

#### Change the implementation without changing the function

`type Counter effect { … }` declares the effect's operations (`effect` here is a kind of type, like `consume` below). `effect Counter { … }` inside `with` provides the implementation (the handler). After `with` come two blocks in curly braces: the implementation and the scope where it applies. The example from [`examples/tour/effects_tour.nv`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/tour/effects_tour.nv) (without the module and comments) should print `total = 6`. `ro` declares an immutable variable, `mut` a mutable one:

```nova
type Counter effect {
    fn next() -> int
}

fn count_three() Counter -> int {
    ro a = Counter.next()
    ro b = Counter.next()
    ro c = Counter.next()
    a + b + c
}

fn main() {
    mut state = 0
    with Counter = effect Counter {
        next() -> int {
            state += 1
            return state
        }
    } {
        ro total = count_three()
        println("total = ${total}")
    }
}
```

The handler yields 1, 2 and 3, while `count_three` only knows about `Counter.next()`. In the aggregator's test the network is swapped in one line ([README, line 174](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/flagship/aggregator/README.md)): `with Net = mock_net(), Emit = null_emit() {`.

<a id="resources"></a>

#### Resources, data races, generics

`consume` defines a type whose values the compiler tracks as a resource (close to ownership in Rust). Such a value is consumed exactly once. If the type has `@cleanup`, a value that was not consumed explicitly is consumed automatically on leaving the scope. Without `@cleanup`, a forgotten value is a compile error.

An example based on [`examples/tour/consume_tour.nv`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/tour/consume_tour.nv): `Resource` is a resource type, `make` creates a value of it, and `@cleanup` is a method of the type. A method is declared as `fn Type @name(…)`: `@` before the name means an implicit receiver (what other languages call `self`), the receiver's fields are available as `@field`, and the word after the type (`consume`, or `mut` for mutating methods) says how the method treats the value. `consume r =` binds a value that has to be consumed. Nobody consumes `r` explicitly, so `@cleanup` is called on leaving the inner block:

```nova
type Resource consume { id int }

fn Resource consume @cleanup(_outcome ScopeOutcome) {
    println("cleanup: ресурс закрыт автоматически")
}

fn make(id int) -> Resource => { id }

fn main() {
    {
        consume r = make(1)
        println("работаем с ресурсом")
    }
    println("вышли из области")
}
```

The program prints the following (checked on the published Oracle 0.1.0 archive for Windows; the compiler warns about calling `println` inside `@cleanup` without the `#cancel_safe` marker, which does not matter for this example). The strings are in Russian: "working with the resource", "cleanup: resource closed automatically", "left the scope":

```text
работаем с ресурсом
cleanup: ресурс закрыт автоматически
вышли из области
```

Data races: Nova checks for unsafe sharing of mutable data between fibers, but does not guarantee the absence of all races: indirect calls to closures remain unchecked. Both implementations have silent errors.

Generics are the foundation of the language and the standard library: the `Vec[T]`, `Option[T]` and `Result[T, E]` types from Nova's `std` are built on them. The notation with type parameters in square brackets is the usual one, there is nothing new here, so I only show it (from `examples/tour/types.nv`, lines 19–21):

```nova
fn first[T](xs []T) -> Option[T] {
    if xs.len() == 0 { None } else { Some(xs[0]) }
}
```

A sum type is a value of one of several variants, and each variant can carry its own data. `Option` and `Result` in Nova are exactly that: `Some`/`None`, `Ok`/`Err`. An example based on [`examples/tour/types.nv`](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/examples/tour/types.nv) (lines 8–16; `main` is mine): `Shape` is a shape, a circle or a rectangle, and `match` takes the variants apart. If you leave out a variant, the compiler refuses (`E_MATCH_NON_EXHAUSTIVE`):

```nova
type Shape enum
    | Circle(f64)
    | Rectangle(f64, f64)

fn area(s Shape) -> f64 => match s {
    Circle(r)       => 3.14 * r * r
    Rectangle(w, h) => w * h
}

fn main() {
    ro c = Circle(2.0)
    ro r = Rectangle(3.0, 4.0)
    println("area(circle)=${area(c)} area(rect)=${area(r)}")
}
```

It prints (checked on the published Oracle 0.1.0 archive for Windows): `area(circle)=12.56 area(rect)=12`.

### An example program in Nova: claude-limits

A small but real program in Nova: [claude-limits](https://github.com/unitcraft/claude-limits), a page with the limits of Claude Code, Kimi Code and Codex accounts and a forecast of usage by the window reset (the period until the limit resets). It uses undocumented APIs; the [Windows build](https://github.com/unitcraft/claude-limits/releases) is separate.

![Three claude-limits cards over made-up accounts: calm, pace, locked](/blog/2026-10-16-ai-compiler-self-build/limits-demo-3cards.png)

*The picture shows only Claude limits. The UI is in English; names and numbers are made up. Three cards: calm, pace (forecast "130% at reset", the limit will run out in 1 h 10 min), locked (limit exhausted). The hatching is the usage forecast up to the reset, the thin line under the bar is the share of the window that has passed, and the window is the period until the limit resets.*

### Where to go next

- the [language website](https://nv-lang.org/): documentation, specification, installation, blog;
- the [tour examples](https://github.com/nv-lang/nova/tree/eee6eae882a46861d70e5eae48648d8a643c8901/examples/tour) and the [Polaris examples](https://github.com/nv-lang/nova-polaris/tree/v0.2.4/examples);
- send bugs to [issues](https://github.com/nv-lang/nova/issues) with the version, OS and a minimal example; I fix first the ones that get in the way of Carina development;
- report vulnerabilities privately as described in [SECURITY.md](https://github.com/nv-lang/nova/blob/eee6eae882a46861d70e5eae48648d8a643c8901/SECURITY.md);
- the [sources](https://github.com/nv-lang/nova) are under MIT OR Apache-2.0, releases are on the [releases page](https://github.com/nv-lang/nova/releases).

Thanks to everyone who read to the end, let's stay in touch!

---

*Originally published in Russian on Habr: [habr.com/ru/articles/1095130](https://habr.com/ru/articles/1095130/).*
