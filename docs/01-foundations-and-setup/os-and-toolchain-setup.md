# Operating System & Toolchain Setup: macOS, Linux, and Windows WSL2

> **Difficulty**: Beginner  
> **Target Outcome**: Establish reproducible package management and polyglot runtime toolchains (Node.js, Python, Go, Rust, Docker).

---

## What You Will Master

- Configuring system package managers (Homebrew, Winget, Apt/Pacman).
- Managing multi-version runtimes using **`mise`** without global environment pollution.
- Windows 11 + WSL2 (Windows Subsystem for Linux) setup for native Linux performance.

---

## 1. System Package Managers

### macOS: Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Windows: Winget and Scoop
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression
```

### Linux (Debian / Ubuntu):
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl git unzip pkg-config libssl-dev
```

---

## 2. Universal Runtime Management with `mise`

Use **`mise`** as a single polyglot tool version manager:

### Installation:
```bash
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate zsh)"' >> ~/.zshrc
```

### Toolchain Provisioning:
```bash
# Install Node.js LTS and set as global default
mise use -g node@lts

# Install Python 3.12
mise use -g python@3.12

# Install Go & Rust
mise use -g go@latest
mise use -g rust@latest

# Verify active versions
mise current
```

---

## 3. Windows 11 WSL2 Configuration

For developers on Windows, WSL2 provides a native Linux kernel:

1. Open PowerShell as Administrator:
   ```powershell
   wsl --install -d Ubuntu-24.04
   ```
2. Enable Systemd support in `/etc/wsl.conf`:
   ```ini
   [boot]
   systemd=true

   [interop]
   appendWindowsPath = false
   ```
3. Store repositories inside the Linux filesystem (`/home/username/work/`), rather than on `/mnt/c/`, to maximize disk I/O performance.

---

## Contributor Challenges
- [ ] Add Nix / Nix Flakes guide for declarative machine configuration.
- [ ] Add macOS containerization guide (Docker Desktop vs OrbStack vs Colima).
