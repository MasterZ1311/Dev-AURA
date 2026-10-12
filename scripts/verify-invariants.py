#!/usr/bin/env python3
"""
scripts/verify-invariants.py

Automated Invariant Verification Test Suite for the Aura Repository.
Validates 4 mandatory repository invariants across all markdown files:
  1. Zero Emojis or Unicode Pictograms (Target: 0)
  2. Relative Internal Link and Anchor Integrity (Target: 100% valid, 0 broken)
  3. 7-Part Canonical Blueprint Conformance (Target: 50/50 instructional modules)
  4. Fenced Code Block Language Specifiers (Target: 100% tagged)

Zero external dependencies (Python standard library only).
Exits 0 on clean pass; exits 1 with actionable failure messages on any violation.
"""

import os
import sys
import re
import urllib.parse
from pathlib import Path

# Directories ignored during repository-wide traversal
IGNORED_DIRS = {'.git', '.agents', 'node_modules', '.vscode', '.idea'}

# Unicode ranges for emoji characters, emoticons, pictograms, symbols, and flags
EMOJI_PATTERN = re.compile(
    r'[\U0001F600-\U0001F64F'  # Emoticons
    r'\U0001F300-\U0001F5FF'  # Misc Symbols and Pictographs
    r'\U0001F680-\U0001F6FF'  # Transport and Map
    r'\U0001F700-\U0001F77F'  # Alchemical Symbols
    r'\U0001F780-\U0001F7FF'  # Geometric Shapes Extended
    r'\U0001F800-\U0001F8FF'  # Supplemental Arrows-C
    r'\U0001F900-\U0001F9FF'  # Supplemental Symbols and Pictographs
    r'\U0001FA00-\U0001FA6F'  # Chess Symbols
    r'\U0001FA70-\U0001FAFF'  # Symbols and Pictographs Extended-A
    r'\u2600-\u26FF'          # Miscellaneous Symbols
    r'\u2700-\u27BF'          # Dingbats
    r'\U0001F1E6-\U0001F1FF]'  # Regional Indicator Symbols / Flags
)

# Common markdown emoji shortcodes (e.g., :rocket:, :fire:)
EMOJI_SHORTCODE_PATTERN = re.compile(
    r':(rocket|fire|sparkles|zap|smile|tada|white_check_mark|check|x|warning|memo|books|bulb|art|wrench|gear|package|lock|key|mag|pushpin|round_pushpin):'
)

# Mandatory 7-Part Canonical Blueprint Section Headings
CANONICAL_BLUEPRINT_SECTIONS = [
    '## 1. The Hook: Why You Need This in Your Arsenal',
    '## 2. The Mental Model: Intuitive Analogy & Visual Topology',
    '## 3. Deep Dive: Under the Hood',
    '## 4. Zero-to-One Interactive Playground: Build It From Scratch',
    '## 5. Battle Scars: What Breaks in Production & How to Debug It',
    '## 6. The Weekend Hackathon Challenge: Your Turn to Build',
    '## 7. Knowledge Check & Next Steps',
]

# Canonical blueprint root categories
BLUEPRINT_TRACKS = (
    os.path.normpath('docs/engineering-principles'),
    os.path.normpath('docs/learning-paths'),
    os.path.normpath('docs/project-case-studies'),
)


def get_repo_root() -> Path:
    """Resolve repository root directory relative to this script."""
    return Path(__file__).resolve().parent.parent


def find_all_markdown_files(repo_root: Path) -> list[Path]:
    """Recursively collect all repository markdown files, omitting ignored paths."""
    md_files = []
    for root, dirs, files in os.walk(repo_root):
        # Prune ignored directories in-place
        dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
        for file in files:
            if file.endswith('.md'):
                md_files.append(Path(root) / file)
    return sorted(md_files)


def slugify_heading(heading_text: str) -> str:
    """
    Generate a GitHub-compatible markdown heading anchor slug.
    Strips HTML tags, links, formatting backticks, and punctuation while mapping spaces to hyphens.
    """
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', heading_text)
    # Strip markdown links [label](url) -> label
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Strip inline code formatting backticks
    text = text.replace('`', '')
    # Strip trailing hashes (ATX style headings: ## Heading ##)
    text = re.sub(r'\s+#+\s*$', '', text)
    # To lower case
    text = text.lower().strip()
    # Punctuation stripping: keep alphanumeric, hyphens, and whitespace
    # Replace whitespace characters with hyphens
    slug_chars = []
    for ch in text:
        if ch.isalnum() or ch == '-':
            slug_chars.append(ch)
        elif ch in (' ', '\t'):
            slug_chars.append('-')
    return ''.join(slug_chars)


def extract_file_anchors(file_path: Path) -> set[str]:
    """Extract all valid anchor identifiers (slugified headings and HTML id/name attrs) from a file."""
    anchors = set()
    slug_counts: dict[str, int] = {}

    try:
        content = file_path.read_text(encoding='utf-8', errors='replace')
    except Exception:
        return anchors

    in_code_block = False
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.startswith('```') or stripped.startswith('~~~'):
            in_code_block = not in_code_block
            continue
        if in_code_block:
            continue

        # Markdown headings
        m_head = re.match(r'^#{1,6}\s+(.+)$', stripped)
        if m_head:
            raw_title = m_head.group(1).strip()
            slug = slugify_heading(raw_title)
            if slug:
                if slug in slug_counts:
                    slug_counts[slug] += 1
                    anchors.add(f'{slug}-{slug_counts[slug]}')
                else:
                    slug_counts[slug] = 0
                    anchors.add(slug)

        # HTML id and name attributes (e.g. <a id="...">, <div id="...">, <a name="...">)
        for m_id in re.finditer(r'(?:id|name)=["\']([^"\']+)["\']', line):
            anchors.add(m_id.group(1).lower())

    return anchors


def test_zero_emojis(md_files: list[Path], repo_root: Path) -> tuple[bool, list[str]]:
    """Invariant 1: Assert 0 emojis or unicode pictograms across all markdown files."""
    violations = []
    for fpath in md_files:
        rel = fpath.relative_to(repo_root)
        try:
            content = fpath.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            violations.append(f"{rel}: Failed to read file: {e}")
            continue

        for line_no, line in enumerate(content.splitlines(), 1):
            for match in EMOJI_PATTERN.finditer(line):
                char = match.group()
                cp = f"U+{ord(char):04X}" if len(char) == 1 else f"U+{ord(char[0]):04X} U+{ord(char[1]):04X}"
                violations.append(
                    f"{rel}:{line_no}: Unicode emoji/pictogram found: '{char}' ({cp})"
                )
            for match in EMOJI_SHORTCODE_PATTERN.finditer(line):
                violations.append(
                    f"{rel}:{line_no}: Markdown emoji shortcode found: '{match.group()}'"
                )

    return len(violations) == 0, violations


def test_link_integrity(md_files: list[Path], repo_root: Path) -> tuple[bool, list[str]]:
    """Invariant 2: Assert 100% relative internal markdown links and anchor fragment tags resolve cleanly."""
    violations = []
    # Pre-index all available markdown file anchors
    file_anchors: dict[Path, set[str]] = {}
    for fpath in md_files:
        file_anchors[fpath.resolve()] = extract_file_anchors(fpath)

    # Patterns for links
    md_link_pattern = re.compile(r'!?\[.*?\]\((.*?)\)')
    html_link_pattern = re.compile(r'<a\s+(?:[^>]*?\s+)?href=["\'](.*?)["\']')
    html_img_pattern = re.compile(r'<img\s+(?:[^>]*?\s+)?src=["\'](.*?)["\']')

    for fpath in md_files:
        rel_from_root = fpath.relative_to(repo_root)
        try:
            content = fpath.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            violations.append(f"{rel_from_root}: Failed to read file: {e}")
            continue

        in_code_block = False
        for line_no, line in enumerate(content.splitlines(), 1):
            stripped = line.strip()
            if stripped.startswith('```') or stripped.startswith('~~~'):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                continue

            targets = []
            for m in md_link_pattern.finditer(line):
                raw = m.group(1).strip()
                # If target has a markdown title like `[text](url "title")`, take first token
                target = raw.split()[0] if raw else ''
                targets.append(target)
            for m in html_link_pattern.finditer(line):
                targets.append(m.group(1).strip())
            for m in html_img_pattern.finditer(line):
                targets.append(m.group(1).strip())

            for target in targets:
                if not target:
                    continue
                # Ignore external protocols
                if target.startswith(('http://', 'https://', 'mailto:', 'ftp://', 'javascript:', 'data:')):
                    continue

                # Parse file path vs anchor fragment
                url_parts = urllib.parse.urldefrag(target)
                rel_target_path = url_parts.url
                frag = url_parts.fragment.lower()

                # Determine target file
                if not rel_target_path:
                    target_file = fpath.resolve()
                else:
                    target_file = (fpath.parent / rel_target_path).resolve()

                if not target_file.exists():
                    violations.append(
                        f"{rel_from_root}:{line_no}: Broken relative link target '{target}' -> path does not exist: {target_file}"
                    )
                    continue

                # Validate anchor fragment if present
                if frag:
                    if target_file not in file_anchors:
                        violations.append(
                            f"{rel_from_root}:{line_no}: Fragment '#{frag}' referenced on non-markdown target: {target_file}"
                        )
                    elif frag not in file_anchors[target_file]:
                        violations.append(
                            f"{rel_from_root}:{line_no}: Broken anchor '#{frag}' in target {target_file.name}"
                        )

    return len(violations) == 0, violations


def test_canonical_blueprint_conformance(md_files: list[Path], repo_root: Path) -> tuple[bool, list[str]]:
    """Invariant 3: Assert 100% 7-Part Canonical Blueprint conformance on all 50 instructional lesson modules."""
    violations = []

    # Filter exactly the 50 instructional lesson modules (excluding directory READMEs)
    blueprint_modules = []
    for fpath in md_files:
        if fpath.name == 'README.md':
            continue
        rel = fpath.relative_to(repo_root)
        rel_str = str(rel)
        if any(rel_str.startswith(track) for track in BLUEPRINT_TRACKS):
            blueprint_modules.append(fpath)

    expected_count = 50
    if len(blueprint_modules) != expected_count:
        violations.append(
            f"Expected {expected_count} instructional blueprint modules, but discovered {len(blueprint_modules)}."
        )

    for fpath in blueprint_modules:
        rel = fpath.relative_to(repo_root)
        try:
            content = fpath.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            violations.append(f"{rel}: Failed to read file: {e}")
            continue

        indices = []
        missing_sections = []
        for section in CANONICAL_BLUEPRINT_SECTIONS:
            idx = content.find(section)
            if idx == -1:
                missing_sections.append(section)
            else:
                indices.append(idx)

        if missing_sections:
            violations.append(
                f"{rel}: Missing {len(missing_sections)} canonical sections: {missing_sections}"
            )
        elif indices != sorted(indices):
            violations.append(
                f"{rel}: Canonical blueprint sections appear out of sequential order."
            )

    return len(violations) == 0, violations


def test_fenced_code_languages(md_files: list[Path], repo_root: Path) -> tuple[bool, list[str]]:
    """Invariant 4: Assert 100% fenced code blocks specify an explicit language identifier across all markdown files."""
    violations = []

    for fpath in md_files:
        rel = fpath.relative_to(repo_root)
        try:
            content = fpath.read_text(encoding='utf-8', errors='replace')
        except Exception as e:
            violations.append(f"{rel}: Failed to read file: {e}")
            continue

        in_code_block = False
        fence_marker = ''
        fence_char = ''

        for line_no, line in enumerate(content.splitlines(), 1):
            stripped = line.lstrip()
            if stripped.startswith('```') or stripped.startswith('~~~'):
                char = stripped[0]
                # Measure run length of fence marker
                idx = 0
                while idx < len(stripped) and stripped[idx] == char:
                    idx += 1
                cur_marker = stripped[:idx]
                info = stripped[idx:].strip()

                if not in_code_block:
                    # Opening code fence
                    in_code_block = True
                    fence_marker = cur_marker
                    fence_char = char
                    if not info:
                        violations.append(
                            f"{rel}:{line_no}: Untagged opening code fence (missing language specifier): '{line.strip()}'"
                        )
                else:
                    # Closing fence candidate
                    if char == fence_char and len(cur_marker) >= len(fence_marker) and not info:
                        in_code_block = False

        if in_code_block:
            violations.append(
                f"{rel}: Unterminated code fence detected (file ends while still inside a code block)."
            )

    return len(violations) == 0, violations


def main() -> int:
    repo_root = get_repo_root()
    print("=" * 78)
    print("  AURA REPOSITORY INVARIANT VERIFICATION SUITE")
    print(f"  Target Root: {repo_root}")
    print("=" * 78)

    md_files = find_all_markdown_files(repo_root)
    print(f"Discovered {len(md_files)} markdown files across repository.\n")

    test_suites = [
        ("Invariant 1: Zero Emojis and Unicode Pictograms", test_zero_emojis),
        ("Invariant 2: Relative Internal Links and Anchor Integrity", test_link_integrity),
        ("Invariant 3: 7-Part Canonical Blueprint Conformance", test_canonical_blueprint_conformance),
        ("Invariant 4: Fenced Code Block Language Specifiers", test_fenced_code_languages),
    ]

    all_passed = True
    total_violations = 0

    for name, test_fn in test_suites:
        passed, violations = test_fn(md_files, repo_root)
        if passed:
            print(f"[PASS] {name}")
        else:
            all_passed = False
            total_violations += len(violations)
            print(f"[FAIL] {name} ({len(violations)} violation{'s' if len(violations) != 1 else ''})")
            for v in violations[:20]:
                print(f"       ! {v}")
            if len(violations) > 20:
                print(f"       ... and {len(violations) - 20} more violations.")

    print("\n" + "=" * 78)
    if all_passed:
        print("  RESULT: 100% PASS - ALL REPOSITORY INVARIANTS SATISFIED")
        print("=" * 78)
        return 0
    else:
        print(f"  RESULT: FAILED WITH {total_violations} TOTAL VIOLATION(S)")
        print("=" * 78)
        return 1


if __name__ == '__main__':
    sys.exit(main())
