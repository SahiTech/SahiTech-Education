"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./academic/types.js"), exports);
__exportStar(require("./academic/qawmi.js"), exports);
__exportStar(require("./academic/alia.js"), exports);
__exportStar(require("./academic/evaluation.js"), exports);
__exportStar(require("./academic/sanad.js"), exports);
__exportStar(require("./tenancy/types.js"), exports);
__exportStar(require("./rbac/permissions.js"), exports);
__exportStar(require("./sis/types.js"), exports);
__exportStar(require("./sis/admissions.js"), exports);
__exportStar(require("./finance/types.js"), exports);
__exportStar(require("./finance/accounting.js"), exports);
