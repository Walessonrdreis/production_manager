"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.brDateToISO = brDateToISO;
exports.isSim = isSim;
// src/integrations/omie/omieUtils.ts
function brDateToISO(d) {
    if (!d)
        return null;
    const [dd, mm, yyyy] = d.split('/');
    if (!dd || !mm || !yyyy)
        return null;
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}
function isSim(v) {
    return String(v ?? '').trim().toUpperCase() === 'S';
}
