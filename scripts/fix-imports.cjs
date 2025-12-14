const replace = require('replace-in-file');

const options = {
  files: 'dist/**/*.js',
  from: /\.scss/g,
  to: '.css',
};

try {
  const results = replace.replaceInFileSync(options);
  console.log('Replacement results:', results.filter(r => r.hasChanged).map(r => r.file));
} catch (error) {
  console.error('Error occurred:', error);
}
