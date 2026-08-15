# Terminal & Shell Configuration: Modern CLI Tooling

> **Difficulty**: Intermediate  
> **Target Outcome**: Upgrade traditional POSIX shell environments to a high-speed Zsh/Fish shell with modern Rust-based CLI utilities.

---

## What You Will Master

- Replacing legacy UNIX utilities (`grep`, `find`, `cat`, `ls`, `cd`) with multi-threaded modern equivalents.
- Configuring the cross-shell **Starship Prompt** for contextual telemetry (Git status, runtime versions).
- Interactive fuzzy search across history and filesystems with `fzf`.
- Shell autosuggestions and syntax highlighting.

---

## Modern CLI Replacement Matrix

| Standard Command | Modern Replacement | Implementation Language | Primary Advantage |
| :--- | :--- | :---: | :--- |
| `cd` | **`zoxide`** (`z`) | Rust | Frecency-based directory jumping (`z myproject`). |
| `ls` | **`eza`** | Rust | Git status integration, tree hierarchy, metadata display. |
| `cat` | **`bat`** | Rust | Syntax highlighting, line numbers, Git modifications, automatic paging. |
| `grep` | **`ripgrep`** (`rg`) | Rust | Multi-threaded recursive search; respects `.gitignore` rules. |
| `find` | **`fd`** | Rust | Simplified syntax (`fd pattern`), ignores hidden/git files by default. |
| `top` / `htop` | **`btop`** | C++ | Resource monitoring dashboard (CPU, memory, disk, network). |
| `curl` (API testing) | **`httpie`** or **`curlie`** | Python/Go | Colorized, formatted JSON responses by default. |

---

## Installation Across Platforms

### macOS (Homebrew):
```bash
brew install starship zoxide eza bat ripgrep fd fzf btop
```

### Linux (Debian / Ubuntu) / WSL:
```bash
sudo apt update && sudo apt install -y ripgrep fd-find fzf btop
curl -sS https://starship.rs/install.sh | sh
curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh
```

### Windows (Winget):
```powershell
winget install Starship.Starship ajeetdsouza.zoxide BurntSushi.ripgrep.MSVC sharkdp.fd junegunn.fzf sharkdp.bat eza-community.eza
```

---

## Configuring the Starship Prompt

Append to the end of `~/.zshrc` (or `~/.bashrc`):
```bash
eval "$(starship init zsh)"
eval "$(zoxide init zsh)"
```

### Configuration (`~/.config/starship.toml`):
```toml
format = """
$directory\
$git_branch\
$git_status\
$nodejs\
$python\
$golang\
$docker_context\
$character"""

[directory]
truncation_length = 3
truncate_to_repo = true
style = "bold cyan"

[git_branch]
style = "bold purple"
symbol = "git: "

[git_status]
style = "bold red"
format = '([\[$all_status$ahead_behind\]]($style) )'

[character]
success_symbol = "[->](bold green)"
error_symbol = "[x](bold red)"
```

---

## Recommended Aliases

Add to your shell configuration (`~/.zshrc` or `~/.bashrc`):

```bash
# Modern CLI Aliases
alias ls="eza --group-directories-first"
alias ll="eza -la --group-directories-first --git"
alias tree="eza --tree"
alias cat="bat --paging=never"
alias preview="bat"

# Version Control Aliases
alias gs="git status -sb"
alias gl="git log --oneline --graph --decorate -n 15"
alias gco="git checkout"
alias gcb="git checkout -b"
alias gaa="git add -A"
alias gcm="git commit -m"
alias gp="git push"
alias gpf="git push --force-with-lease"

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."
```

---

## Contributor Challenges
- [ ] Add guide on **tmux** session persistence and custom keybindings.
- [ ] Add **Fish Shell** configuration with Fisher package manager.
