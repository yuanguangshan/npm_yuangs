/**
 * p-limit 测试桩。
 *
 * 真实 p-limit v7 是纯 ESM（package.json "type":"module"），而本项目用 ts-jest，
 * 无法加载 node_modules 里的 ESM，导致 `handleAIChat → fileReader → p-limit`（以及
 * ContextGatherer / git review / git resolve）链上的测试套件全部 fail-to-run。
 *
 * 测试均不依赖真实的并发限制语义，这里提供同 API 的直通实现：
 *   pLimit(n) 返回 limit(fn)，limit(fn) 立即执行 fn 并返回其结果的 Promise。
 *
 * 仅用于 jest；生产代码运行时仍用真实 p-limit v7（Node 原生支持其 ESM）。
 */
function pLimit() {
  return (fn) => Promise.resolve().then(fn);
}

module.exports = pLimit;
module.exports.default = pLimit;
