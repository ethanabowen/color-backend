/* eslint-disable @typescript-eslint/no-var-requires */

const esbuild = require('esbuild');
const { resolve } = require('path');
const { readdir } = require('fs/promises');

// Get the directory name using __dirname directly
const SHARED_BUILD_OPTIONS = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: ['aws-lambda'],
  alias: {
    '@shared': resolve(__dirname, '../src/shared'),
    '@functions': resolve(__dirname, '../src/functions')
  }
};

async function buildLambdaFunctions() {
  try {
    // Read all function directories
    const functionsDir = resolve(__dirname, '../src/functions');
    const functionDirs = await readdir(functionsDir, { withFileTypes: true });
    
    // Filter for directories and build each Lambda function
    const buildPromises = functionDirs
      .filter((dirent: { isDirectory: () => boolean }) => dirent.isDirectory())
      .map(async (dirent: { name: string }) => {
        const functionName = dirent.name;
        const entryPoint = resolve(functionsDir, functionName, 'handler.ts');
        const outfile = resolve(__dirname, '../dist/functions', functionName, 'handler.js');

        const buildOptions = {
          ...SHARED_BUILD_OPTIONS,
          entryPoints: [entryPoint],
          outfile,
        };

        console.log(`Building Lambda function: ${functionName}`);
        return esbuild.build(buildOptions);
      });

    await Promise.all(buildPromises);
    console.log('All Lambda functions built successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildLambdaFunctions(); 