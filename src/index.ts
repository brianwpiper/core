#!/usr/bin/env node

import { ClimbingWallCLI } from './cli/ClimbingWallCLI.js';

async function main() {
  const cli = new ClimbingWallCLI();
  await cli.run(process.argv);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
