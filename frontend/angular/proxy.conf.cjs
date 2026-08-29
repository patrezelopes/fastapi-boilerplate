/**
 * A API é servida pelo mesmo origin através deste proxy. Isso não é
 * conveniência: o refresh token vive num cookie httpOnly host-only, que o
 * navegador só devolve para a origem que o emitiu.
 */
module.exports = {
  "/api": {
    target: process.env["VITE_API_TARGET"] || "http://localhost:8000",
    secure: false,
    changeOrigin: false,
  },
};
