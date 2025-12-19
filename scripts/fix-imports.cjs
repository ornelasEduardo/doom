const replace = require("replace-in-file");

// Step 1: Fix .scss to .css imports
const scssOptions = {
  files: "dist/**/*.js",
  from: /\.scss/g,
  to: ".css",
};

// Step 2: Fix directory imports to explicit index.js imports
// Matches patterns like: from './components/Button' or from "./components/Button"
// and converts them to: from './components/Button/index.js'
const directoryImportOptions = {
  files: "dist/**/*.js",
  from: [
    // Match: from './path' or from "./path" (without file extension)
    // But NOT: from './path.js' or from './path.css' (already has extension)
    /(from\s+['"])(\.[^'"]*?)(['"])/g,
  ],
  to: (match, prefix, path, suffix) => {
    // If the path already has an extension, don't modify it
    if (path.match(/\.(js|css|json)$/)) {
      return match;
    }
    // Add /index.js to directory imports
    return `${prefix}${path}/index.js${suffix}`;
  },
};

try {
  console.log("Fixing .scss imports...");
  const scssResults = replace.replaceInFileSync(scssOptions);
  console.log(
    "SCSS replacement results:",
    scssResults.filter((r) => r.hasChanged).map((r) => r.file)
  );

  console.log("\nFixing directory imports...");
  const dirResults = replace.replaceInFileSync(directoryImportOptions);
  console.log(
    "Directory import replacement results:",
    dirResults.filter((r) => r.hasChanged).map((r) => r.file)
  );

  console.log("\n✅ All imports fixed successfully!");
} catch (error) {
  console.error("Error occurred:", error);
  process.exit(1);
}
