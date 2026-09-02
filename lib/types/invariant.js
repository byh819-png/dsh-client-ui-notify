/**
 * Package-owned invariant companion for `@deepseek-ai/dsh-client-ui-notify`.
 * @module @deepseek-ai/dsh-client-ui-notify/invariant
 */
const PACKAGE_NAME = '@deepseek-ai/dsh-client-ui-notify';
/** Cordis companion plugin name. */
export const name = 'client-ui-notify-invariant';
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants'];
/**
 * No runtime invariant: the settings scope validates and publishes the durable
 * section, while the runtime emits `notify/config` synchronously with its own
 * mutations. Observation-edge behavior is covered directly by this package's
 * Host, runtime, and row behavior specs.
 */
const install = () => { };
/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx) => Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install));
/* jscpd:ignore-end */
//# sourceMappingURL=invariant.js.map