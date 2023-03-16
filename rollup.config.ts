import typescript from 'rollup-plugin-typescript2';
import { asStruct, isString } from 'ts-runtime-typecheck';
import { dirname } from 'path';
import pkg from './package.json' assert { type: 'json' };

const { main: MAIN, module: MODULE } = asStruct({
  main: isString,
  module: isString,
})(pkg);

export default {
  input: `src/index.ts`,
  output: [
    {
      dir: `dist/${dirname(MAIN)}`,
      entryFileNames: '[name].js',
      format: 'cjs',
    },
    {
      dir: `dist/${dirname(MODULE)}`,
      entryFileNames: '[name].mjs',
      format: 'esm',
    },
  ],
  plugins: [
    // Compile TypeScript files
    typescript({ tsconfig: './tsconfig.main.json' }),
  ],
};
