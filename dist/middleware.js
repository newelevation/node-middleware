var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === "object") || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) =>
  __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// middleware.ts
var middleware_exports = {};
__export(middleware_exports, {
  makePipeline: () => makePipeline,
  passOutputAlong: () => passOutputAlong,
});
module.exports = __toCommonJS(middleware_exports);
var makePipeline = (use = []) => {
  const pipeline = () => {
    return async (input, output) => {
      const list = use.slice(0);
      const next = async (input2, output2) => {
        const current = list.shift();
        if (current) {
          return await current(next)(input2, output2);
        }
        return output2;
      };
      const head = list.shift();
      if (head) {
        return await head(next)(input, output);
      }
      return output;
    };
  };
  return pipeline;
};
var passOutputAlong = async (_, output) => output;
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    makePipeline,
    passOutputAlong,
  });
//# sourceMappingURL=middleware.js.map
