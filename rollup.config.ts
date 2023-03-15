// import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
// import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
// import typescript from '@rollup/plugin-typescript';
// import terser from '@rollup/plugin-terser';
// import json from '@rollup/plugin-json';
import { asStruct, isString } from 'ts-runtime-typecheck';
import { dirname } from 'path';
import pkg from './package.json' assert { type: 'json' };

const { main: MAIN, module: MODULE } = asStruct({
  main: isString,
  module: isString,
})(pkg);

// const libraryName = 'jmespath';

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
    // { file: MAIN, name: libraryName, format: 'umd', exports: 'named', sourcemap: false },

    // { file: MODULE, format: 'esm', exports: 'named', sourcemap: false },
    // {
    //   file: MODULE.replace('esm.js', 'esm.min.js'),
    //   format: 'esm',
    //   exports: 'named',
    //   sourcemap: true,
    //   plugins: [terser()],
    // },
  ],
  // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
  // external: [],
  // watch: {
  //   include: ['src/**'],
  // },
  plugins: [
    // Allow json resolution
    // json(),
    // Compile TypeScript files
    typescript({ tsconfig: './tsconfig.main.json' }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    // commonjs({ extensions: ['.js', '.ts'] }),
    // // Allow node_modules resolution, so you can use 'external' to control
    // // which external modules to include in the bundle
    // // https://github.com/rollup/rollup-plugin-node-resolve#usage
    // resolve(),

    // // Resolve source maps to the original source
    // sourceMaps(),
  ],
};
