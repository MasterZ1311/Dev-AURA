# IDE & Editor Mastery: Environment Setup and Typography

> **Difficulty**: Beginner to Intermediate  
> **Target Outcome**: Build a low-latency, distraction-free editing powerhouse in VS Code or Cursor.

---

## What You Will Master

- Selecting and configuring developer typography with ligature support.
- Essential VS Code and Cursor extension suite with minimal overhead.
- Critical keybindings (multi-cursor, quick file jump, command palette).
- Clean `settings.json` configuration for a minimal, focused workspace.

---

## Typography and Readability

1. **Geist Mono** (Vercel) – Modern, clean monospace geometry.
2. **JetBrains Mono** – Engineered for code legibility with distinct character shapes.
3. **Fira Code** – Established monospace typeface with programming ligatures (`!=`, `=>`, `===`).
4. **Berkeley Mono** / **MonoLisa** – Commercial typefaces with precise character proportions.

### Configuring Typography in VS Code:
```json
{
  "editor.fontFamily": "'JetBrains Mono', 'Geist Mono', 'Fira Code', monospace",
  "editor.fontLigatures": true,
  "editor.fontSize": 14.5,
  "editor.lineHeight": 1.6,
  "editor.letterSpacing": 0.5
}
```

---

## Essential Extension Suite

Curate a focused extension list to avoid editor startup and runtime latency:

### 1. Formatting and Static Analysis
- **Prettier - Code Formatter** (`esbenp.prettier-vscode`): Universal formatting on save.
- **Biome** or **ESLint**: Fast linting and AST-based code analysis.
- **Error Lens** (`usernamehw.errorlens`): Renders diagnostics inline without requiring mouse hover.

### 2. Version Control
- **GitLens** or **Git Graph**: Commit lineage and interactive blame annotations.
- **GitHub Pull Requests and Issues**: Review and manage PRs directly inside the editor.

### 3. Navigation and Productivity
- **Path Intellisense**: Fast autocomplete for filenames and imports.
- **Total TypeScript**: Detailed hover diagnostics and type explanations.
- **Tailwind CSS IntelliSense**: Autocomplete and class validation for Tailwind projects.

---

## Standard `settings.json` Configuration

Add these settings to your VS Code `settings.json`:

```json
{
  // User Interface
  "workbench.colorTheme": "Catppuccin Mocha",
  "workbench.iconTheme": "catppuccin-frappe",
  "workbench.activityBar.location": "hidden",
  "workbench.statusBar.visible": true,
  "editor.minimap.enabled": false,

  // Typography and Rendering
  "editor.fontFamily": "'JetBrains Mono', monospace",
  "editor.fontLigatures": true,
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.smoothScrolling": true,
  "editor.renderWhitespace": "selection",

  // Code Hygiene on Save
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit",
    "source.organizeImports": "explicit"
  },
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  // Terminal Integration
  "terminal.integrated.fontSize": 14,
  "terminal.integrated.smoothScrolling": true
}
```

---

## Essential Keybindings

| Action | macOS Shortcut | Windows / Linux Shortcut |
| :--- | :--- | :--- |
| **Command Palette (Universal command)** | `Cmd + Shift + P` | `Ctrl + Shift + P` |
| **Quick File Open (Fuzzy search)** | `Cmd + P` | `Ctrl + P` |
| **Multi-Cursor (Add next occurrence)** | `Cmd + D` | `Ctrl + D` |
| **Move Line Up / Down** | `Option + Up / Down` | `Alt + Up / Down` |
| **Duplicate Line Up / Down** | `Option + Shift + Up / Down` | `Alt + Shift + Up / Down` |
| **Toggle Integrated Terminal** | `Ctrl + \`` | `Ctrl + \`` |
| **Symbol / Function Search in File** | `Cmd + Shift + O` | `Ctrl + Shift + O` |
| **Split Editor Vertically** | `Cmd + \` | `Ctrl + \` |

---

## Contributor Challenges
- [ ] Add starter Lua configuration for Neovim / LazyVim users.
- [ ] Add JetBrains IntelliJ / WebStorm keymap compatibility settings.
