const replace = require("replace-in-file");
const fs = require("fs");
const path = require("path");

// Step 1: Fix .scss to .css imports
const scssOptions = {
  files: "dist/**/*.js",
  from: /\.scss/g,
  to: ".css",
};

// Step 2: Fix imports to add proper .js extensions
// This needs to be smart about whether to add .js or /index.js
const fixImports = () => {
  const glob = require("glob");
  const files = glob.sync("dist/**/*.js");

  files.forEach((file) => {
    let content = fs.readFileSync(file, "utf8");
    let modified = false;

    // Match: from './path' or from "./path" (without file extension)
    content = content.replace(
      /(from\s+['"])(\.[^'"]*?)(['"])/g,
      (match, prefix, importPath, suffix) => {
        // If the path already has an extension, don't modify it
        if (importPath.match(/\.(js|css|json)$/)) {
          return match;
        }

        // Resolve the import path relative to the current file
        const fileDir = path.dirname(file);
        const resolvedPath = path.resolve(fileDir, importPath);

        // Check if it's a directory
        if (
          fs.existsSync(resolvedPath) &&
          fs.statSync(resolvedPath).isDirectory()
        ) {
          // It's a directory, add /index.js
          modified = true;
          return `${prefix}${importPath}/index.js${suffix}`;
        } else if (fs.existsSync(resolvedPath + ".js")) {
          // It's a file, add .js
          modified = true;
          return `${prefix}${importPath}.js${suffix}`;
        }

        // If we can't determine, assume it's a file and add .js
        modified = true;
        return `${prefix}${importPath}.js${suffix}`;
      }
    );

    if (modified) {
      fs.writeFileSync(file, content, "utf8");
    }
  });
};

try {
  console.log("Fixing .scss imports...");
  const scssResults = replace.replaceInFileSync(scssOptions);
  console.log(
    "SCSS replacement results:",
    scssResults.filter((r) => r.hasChanged).map((r) => r.file)
  );

  console.log("\nFixing ESM imports...");
  fixImports();
  console.log("✅ ESM imports fixed!");

  console.log("\n✅ All imports fixed successfully!");
} catch (error) {
  console.error("Error occurred:", error);
  process.exit(1);
}
