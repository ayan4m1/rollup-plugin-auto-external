import path from 'path';
import semver from 'semver';
import { readPackageSync } from 'read-pkg';
import getBuiltins from 'builtins';
import safeResolve from 'safe-resolve';

export default ({
  builtins = true,
  dependencies = true,
  packagePath,
  peerDependencies = true
} = {}) => ({
  name: 'auto-external',
  options(opts) {
    const pkg = readPackageSync(packagePath);
    let ids = [];

    if (dependencies && pkg.dependencies) {
      ids = ids.concat(Object.keys(pkg.dependencies));
    }

    if (peerDependencies && pkg.peerDependencies) {
      ids = ids.concat(Object.keys(pkg.peerDependencies));
    }

    if (builtins) {
      const list = [];

      if (typeof builtins === 'string' && semver.valid(builtins)) {
        list.push(...getBuiltins(builtins));
      } else {
        list.push(...getBuiltins());
      }

      ids = ids.concat(list);
      ids = ids.concat(list.map((builtin) => `node:${builtin}`));
    }

    ids = ids.map(safeResolve).filter(Boolean);

    const external = (id) => {
      if (typeof opts.external === 'function' && opts.external(id)) {
        return true;
      }

      if (Array.isArray(opts.external) && opts.external.includes(id)) {
        return true;
      }

      /**
       * The `id` argument is a resolved path if `rollup-plugin-node-resolve`
       * and `rollup-plugin-commonjs` are included.
       */
      const resolvedPath = safeResolve(id);

      if (resolvedPath === null) {
        return false;
      }

      const resolvedDirname = path.dirname(resolvedPath);

      return ids.some((idx) => resolvedDirname.startsWith(path.dirname(idx)));
    };

    return {
      ...opts,
      external
    };
  }
});
