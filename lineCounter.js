const fs = require("fs");
const path = require("path");

// Define the root directory of the project
const rootDir = "./";

// Define an array of file extensions to include in the count
const extensions = [".js", ".jsx", ".ts", ".tsx"];

// Initialize a variable to store the total number of lines of code
let totalLines = 0;

// Recursively traverse the root directory and count the lines of code in each file
function countLines(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && file !== "node_modules" && file !== ".next") {
      countLines(filePath);
    } else {
      const ext = path.extname(filePath);

      if (extensions.includes(ext)) {
        const contents = fs.readFileSync(filePath, "utf8");
        const lines = contents.split(/\r\n|\n/).length;
        totalLines += lines;

        console.log(`Counting ${lines} lines in ${filePath}`);
      }
    }
  }
}

countLines(rootDir);

console.log(`Total number of lines of code: ${totalLines}`);