import { readFileSync, writeFileSync } from "node:fs";

const [, , newVersion, oldVersion, repoUrl] = process.argv;

if (!newVersion || !oldVersion || !repoUrl) {
  console.error(
    "Usage: node update-changelog.mjs <new-version> <old-version> <repo-url>",
  );
  process.exit(1);
}

const date = new Date().toISOString().split("T")[0];
let changelog = readFileSync("CHANGELOG.md", "utf8");

// Extract release notes between [Unreleased] heading and the next version heading or link section.
// Only consume the single newline after the heading — not the blank line — so an
// empty [Unreleased] section is correctly detected as empty after trim().
const notesMatch = changelog.match(
  /## \[Unreleased\]\n([\s\S]*?)(?=\n## \[|\n\[Unreleased\]:)/,
);
const notes = notesMatch?.[1]?.trim();

if (!notes) {
  console.error(
    "Error: [Unreleased] section is empty. Add changelog entries before releasing.",
  );
  process.exit(1);
}

writeFileSync("RELEASE_NOTES.md", notes);

changelog = changelog.replace(
  "## [Unreleased]",
  `## [Unreleased]\n\n## [${newVersion}] — ${date}`,
);

changelog = changelog.replace(
  /(\[Unreleased\]:.*\/compare\/)v[^\s]+\.\.\.HEAD/,
  `$1v${newVersion}...HEAD`,
);

const versionLink = `[${newVersion}]: ${repoUrl}/compare/v${oldVersion}...v${newVersion}`;
changelog = changelog.replace(
  /(\[Unreleased\]:.*\n)/,
  `$1${versionLink}\n`,
);

writeFileSync("CHANGELOG.md", changelog);
console.log(`Updated CHANGELOG.md for v${newVersion}`);
