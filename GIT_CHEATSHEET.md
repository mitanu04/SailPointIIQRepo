# Decoding Git Status

Reference notes on git status letters, diffs, the pager, rebasing/merging, and conflict resolution.

## Status letters (`git status --short`)

Each line is two columns — `X` (staged/index state) then `Y` (working tree state) — followed by the path. `XY path`: `X` = staged state, `Y` = unstaged state. So ` M` is modified-but-not-staged, `M ` is staged-and-clean, and `MM` means staged once, then edited again.

| Letter | Meaning | Notes |
|---|---|---|
| `M` | Modified | Content changed, same file |
| `A` | Added | New file, staged into the index |
| `D` | Deleted | File removed from working tree (or index, if staged) |
| `R` | Renamed | Git matched a delete + add as one move, above its similarity threshold |
| `U` | Unmerged | Both sides touched it during a merge — needs manual resolution |
| `??` | Untracked | Git has never seen this path before |

Example:
```
 M "config/Bundle/Bundle-Business_Shared_DB Admin.xml"
 D config/Bundle/Bundle-BirthrightRapidSetup.xml
?? config/Bundle/BR_Contractor_Base.xml
?? config/Bundle/Bundle-BirthrightRapidSetupSharedDB.xml
```

## Reading a diff

| Command | Shows |
|---|---|
| `git diff` | Unstaged changes — working tree vs. the index |
| `git diff --stat` | One line per file: insertions/deletions, no content |
| `git diff -- "path with spaces.xml"` | Limit to one file; quote paths with spaces |
| `git diff --cached` (alias `--staged`) | Staged changes vs. the last commit |
| `git diff HEAD` | Everything changed vs. the last commit — staged and unstaged |

## Escaping the pager (`less`)

Long output gets piped through `less` — that's the `(END)` prompt, not a freeze.

| Key | Action |
|---|---|
| `q` | Quit, back to the shell |
| `Space` | Page down |
| `b` | Page up |
| `↑` / `↓` | Scroll one line |
| `/text` | Search forward |
| `n` | Next search match |

- Skip the pager for one command: `git --no-pager diff …`
- Skip it permanently: `git config --global core.pager cat`

## Basic scenarios: commit & push

The everyday loop, start to finish:

1. `git checkout -b feature/my-change` (or `git switch -c feature/my-change`) — branch off before editing
2. Edit files
3. `git add <file>` or `git add -A` — stage what you want in the commit
4. `git commit -m "message"` — snapshot the staged changes
5. `git push -u origin feature/my-change` — first push of a new branch
6. From then on, just `git push` / `git pull` — no need to name the branch again

| Command | Does |
|---|---|
| `git add <file>` | Stage a specific file |
| `git add -A` | Stage everything — new, modified, and deleted |
| `git commit -m "message"` | Commit what's staged |
| `git commit -am "message"` | Stage every already-tracked file's changes *and* commit in one step (skips new/untracked files) |
| `git push` | Push the current branch to its upstream |
| `git push origin feature/my-change` | Push to a specific remote branch, without setting tracking |
| `git push -u origin feature/my-change` | Push **and** set that remote branch as this branch's upstream |

**What `-u` (`--set-upstream`) actually does:** it links your local branch to a specific remote branch, so Git remembers where it goes. Without it, a brand-new local branch has nowhere to push to by default — `git push` alone will error asking you to specify the remote and branch. After one `-u` push, `git push` / `git pull` with no arguments know to sync with that same remote branch, and `git status` can show "ahead/behind" counts against it. You only need `-u` once per branch, the first time you push it.

## Ignoring files (`.gitignore`)

A `.gitignore` at the repo root is just a plain text file, one pattern per line — Git checks it before showing untracked files in `git status`, so matching paths stop cluttering `??` output and stop being `git add -A` candidates. This repo's already has real patterns to copy from:

```gitignore
# Build output — regenerated every build, never commit
build/
dependency-check-reports/

# Secrets — environment credentials must never be committed
build.properties
*.iiq.properties

# Exported jar of custom Java (rebuilt from src/)
**/identityiqCustomizations.*.jar

# OS / IDE noise
.DS_Store
*.log
```

| Pattern | Matches |
|---|---|
| `build/` | A directory named `build`, anywhere it's a top-level entry relative to the `.gitignore`; trailing `/` means "directory only" |
| `*.log` | Any file ending `.log`, in the same directory as the `.gitignore` |
| `**/identityiqCustomizations.*.jar` | The `**` matches any number of directories — so this hits the file at any depth |
| `!important.log` | Negation — un-ignores one path that a broader pattern above it would otherwise catch (order matters: the `!` line must come after the pattern it's excepting from) |
| `# comment` | Ignored by Git, for humans only |

**To add a new ignore rule:** open `.gitignore`, add the pattern, save — no git command needed, it takes effect immediately.

**The gotcha that trips people up:** `.gitignore` only stops *untracked* files from being picked up. If a file is already committed, adding it to `.gitignore` does nothing — Git keeps tracking it. To actually stop tracking it (while leaving the file on disk):
```
git rm --cached path/to/file
```
then commit that removal. Add the pattern to `.gitignore` in the same commit so it doesn't immediately reappear as untracked.

**Debugging why a file is (or isn't) ignored:**
```
git check-ignore -v path/to/file
```
Prints which `.gitignore` line matched, useful when a pattern isn't behaving the way you expect.

**Ignoring something only on your machine**, without changing the shared `.gitignore` everyone commits: add the path to `.git/info/exclude` instead — same syntax, but local-only and never pushed. For rules you want across *every* repo on your machine (editor swap files, OS clutter), point Git at a personal global ignore file once: `git config --global core.excludesfile ~/.gitignore_global`.

## Spotting a rename

An untracked new file next to a deleted one normally shows as two unrelated lines (`D` and `??`) even if most of the content is identical.

1. `git add -A` — stage everything so the delete and the new file both sit in the index
2. `git status --short -M` — re-run status with rename detection on; a high-similarity delete+add pair collapses into one `R` line with a similarity percentage
3. `git reset` — not ready to commit? This unstages everything again without touching the working tree

## Moving changes to a new branch

You've been editing on the wrong branch and the changes are only in the working tree, not committed anywhere.

**If the new branch starts from the current commit** (the common case), Git just carries the edits along:
```
git switch -c new-branch
```

**Safer / general case** — set changes aside first:
1. `git stash push -u -m "message"` — shelves tracked and untracked (`-u`) edits, working tree goes clean
2. `git switch -c new-branch` — create the branch you actually meant to work on
3. `git stash pop` — reapply the shelved edits here (use `stash apply` to keep the stash as a backup)

Inspecting stashes: `git stash list`, `git stash show -p stash@{0}`, `git stash drop stash@{0}`.

> **Already committed on the wrong branch?** `git branch new-branch` (marks the commits from where you are), then `git reset --hard <commit-before-your-work>` to rewind the original branch. The reset is destructive to that branch's tip — check `git log` for the right target commit first.

## Rebase vs. merge

Both bring one branch's commits into another. The difference is what the result looks like — and rebase's rewritten history is where most of the pain comes from, so read the callouts below, not just the table.

| Command | Does |
|---|---|
| `git merge feature` (run on main) | Joins histories with a new merge commit; nothing existing is rewritten |
| `git rebase main` (run on feature) | Replays feature's commits onto main's current tip — **new commit hashes**, straight-line history |
| `git rebase -i HEAD~3` | Interactive rebase — reorder, squash, or reword the last 3 commits |
| `git rebase --continue` | After resolving a conflict mid-rebase, replay the next commit |
| `git rebase --skip` | Drop the commit currently causing a conflict and move to the next one |
| `git rebase --abort` | Bail out entirely, back to exactly how the branch looked before the rebase started |

**When to use which:**
- **Merge** when the branch is shared, or you want history to record that it existed and when it landed. It's always safe — never rewrites commits, never needs a force-push.
- **Rebase** when it's your own local/feature branch and you want a clean, linear log before it lands. Every replayed commit gets a new hash, even if the content is identical.

**The part that actually causes headaches:**

- **If you've already pushed the branch, a rebase forces your next push to be `git push --force-with-lease`.** Since rebase rewrites commit hashes, a plain `git push` gets rejected ("tip behind") — the remote still has the old commits. `--force-with-lease` overwrites the remote branch, but only if nobody else pushed to it since your last fetch (unlike plain `--force`, which overwrites blindly). Never do this on `main` or any branch others are actively working from.
- **`git pull` vs. `git pull --rebase`.** Plain `git pull` = fetch + merge, and creates a merge commit if your local branch diverged from the remote. `git pull --rebase` = fetch + rebase your local commits on top, keeping history linear. Mixing the two styles on the same branch across a team is what usually turns into a mess — pick one convention and stick to it. (`git config --global pull.rebase true` makes rebase the default for all pulls.)
- **Rebase little and often, not once at the end.** Rebasing a feature branch onto `main` weekly means small, easy conflicts each time. Leaving it for a month means every conflicting commit surfaces at once, in order, one by one.
- **Lost after a rebase or merge goes sideways?** `git log --oneline --graph --all` shows the actual shape of all branches — usually clears up confusion faster than reasoning about it in the abstract. `git reflog` is the safety net: it remembers every position `HEAD` has been at, so even after a bad `rebase --abort`-too-late or `reset --hard`, you can find and recover the lost commit.

## Resolving a conflict

Two sides touched the same lines and Git can't guess which wins. It pauses the operation and drops markers into the file:
```
<<<<<<< HEAD
significantModified="1786980633639"
=======
significantModified="1786715806143"
>>>>>>> feature-branch
```

1. `git status` — lists the unmerged files (`UU`, `AA`, `DD`, `AU`, `UA`, …)
2. Edit the file — keep the lines you want, delete the `<<<<<<<` / `=======` / `>>>>>>>` markers
3. `git add <file>` — marks the conflict cleared (not a normal stage)
4. Continue the operation: `git merge --continue`, `git rebase --continue`, or `git cherry-pick --continue`

- **Take one side wholesale**: `git checkout --ours <file>` or `--theirs <file>`, then `git add` it. The meaning flips during a rebase — *ours* becomes the branch you're rebasing onto, *theirs* becomes your own commit being replayed.
- **Change your mind mid-resolution?** `git merge --abort` or `git rebase --abort` drops everything and returns to the pre-operation state.

## Adjacent commands worth knowing

| Command | Shows |
|---|---|
| `git log --oneline --stat` | Commit history with per-file change counts |
| `git show HEAD:path/to/file` | A file's content as of a given commit, without checking it out |
| `git add -p` | Stage a file hunk-by-hunk instead of all-or-nothing |
| `git restore --staged path` | Unstage a single file, leaving the edit itself in place |
