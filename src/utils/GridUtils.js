/* @flow */
"use strict";

/**
 *
 * @param binding {Object}
 * @param fns {Array<string>}
 */
export function bindHandlers (binding: Object, fns: Array<string>) {
  fns.forEach((fn: string) => {
    binding[fn] = binding[fn].bind(binding);
  });
}