"use strict";

const { expect } = require("chai");

exports.expectRejects = function expectRejects(fn, errorLike, pattern) {
  return fn().then(
    () => {
      throw new Error("should have rejected");
    },
    (ex) => {
      if (!(errorLike instanceof RegExp || typeof errorLike === "string")) {
        expect(ex).to.be.instanceof(errorLike);
      }
      else {
        pattern = errorLike;
      }

      if (pattern instanceof RegExp) {
        expect(ex).to.have.property("message").match(pattern);
      }
      else {
        expect(ex).to.have.property("message").equal(pattern);
      }
    });
};
