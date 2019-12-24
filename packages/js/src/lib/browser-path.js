/**
 * This is a replacement for Node's path module for use online. We provide only
 * functions actually used by this library's code. The module loader used during
 * test run in the browser should be configured so that ``require("path")``
 * loads this module.
 */

"use strict";

function join(...parts) {
  let result = new URL(window.location.href);

  const last = parts[parts.length - 1];
  let absolute = false;
  for (let part of parts) {
    // This is a trick to work around an issue with how URLs are computed. Each
    // part in the list passed, except the last, is supposed to be treated as a
    // directory (whether it is or not!) when it is joined with the next
    // part. Suppose join("a/b/c", "d"). We want the result "a/b/c/d". However,
    // the path "a/b/c" when passed as a base URL to ``new URL`` will be
    // interpreted as the directory "a/b". "c" is interpreted as a file and
    // ignored. Adding a slash turns the path into "a/b/c/" and forces "c" to be
    // taken as a directory too.
    if (part !== last && part.length !== 0 && part[part.length - 1] !== "/") {
      part += "/";
    }
    absolute = absolute || part[0] === "/";
    result = new URL(part, result);
  }

  return absolute ? result.pathname : result.pathname.substring(1);
}

exports.join = join;

function dirname(path) {
  const last = path.lastIndexOf("/");
  return last === -1 ? path : path.substring(0, last);
}

exports.dirname = dirname;
