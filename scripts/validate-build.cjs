const fs = require("fs");
const path = require("path");
const glob = require("glob");

console.log("🔍 Validating build output...\n");

let hasErrors = false;

// Check 1: Verify no imports are missing extensions
console.log("1️⃣ Checking for imports without extensions...");
const jsFiles = glob.sync("dist/**/*.js");
let missingExtensions = 0;

jsFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");

  // Match relative imports without extensions
  const badImports = content.match(/(from\s+['"])(\.[^'"]*?)(['"])/g);

  if (badImports) {
    badImports.forEach((match) => {
      // Extract the path
      const pathMatch = match.match(/from\s+['"](\..*?)['"]/);
      if (pathMatch) {
        const importPath = pathMatch[1];

        // Check if it has an extension
        if (!importPath.match(/\.(js|css|json)$/)) {
          console.error(`   ❌ ${file}: ${match}`);
          missingExtensions++;
          hasErrors = true;
        }
      }
    });
  }
});

if (missingExtensions === 0) {
  console.log("   ✅ All imports have proper extensions\n");
} else {
  console.error(
    `   ❌ Found ${missingExtensions} imports without extensions\n`
  );
}

// Check 2: Verify all imports point to existing files
console.log("2️⃣ Checking that all imports resolve to existing files...");
let brokenImports = 0;

jsFiles.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  const fileDir = path.dirname(file);

  const imports = content.match(/(from\s+['"])(\.[^'"]*?)(['"])/g);

  if (imports) {
    imports.forEach((match) => {
      const pathMatch = match.match(/from\s+['"](\..*?)['"]/);
      if (pathMatch) {
        const importPath = pathMatch[1];
        const resolvedPath = path.resolve(fileDir, importPath);

        if (!fs.existsSync(resolvedPath)) {
          console.error(`   ❌ ${file}: Cannot find ${importPath}`);
          console.error(`      Expected: ${resolvedPath}`);
          brokenImports++;
          hasErrors = true;
        }
      }
    });
  }
});

if (brokenImports === 0) {
  console.log("   ✅ All imports resolve to existing files\n");
} else {
  console.error(`   ❌ Found ${brokenImports} broken imports\n`);
}

// Check 3: Verify package.json exports point to existing files
console.log("3️⃣ Checking package.json exports...");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
let exportErrors = 0;

if (pkg.main && !fs.existsSync(pkg.main)) {
  console.error(`   ❌ Main entry "${pkg.main}" does not exist`);
  exportErrors++;
  hasErrors = true;
}

if (pkg.types && !fs.existsSync(pkg.types)) {
  console.error(`   ❌ Types entry "${pkg.types}" does not exist`);
  exportErrors++;
  hasErrors = true;
}

if (pkg.exports) {
  Object.entries(pkg.exports).forEach(([key, value]) => {
    if (typeof value === "string" && !value.startsWith("./package.json")) {
      if (!fs.existsSync(value)) {
        console.error(
          `   ❌ Export "${key}" points to non-existent "${value}"`
        );
        exportErrors++;
        hasErrors = true;
      }
    }
  });
}

if (exportErrors === 0) {
  console.log("   ✅ All package.json exports are valid\n");
} else {
  console.error(`   ❌ Found ${exportErrors} export errors\n`);
}

// Summary
console.log("━".repeat(50));
if (hasErrors) {
  console.error("❌ Build validation FAILED");
  process.exit(1);
} else {
  console.log("✅ Build validation PASSED");
  console.log("\nThe package is ready to publish! 🚀");
}
