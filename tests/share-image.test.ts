import { test } from "node:test";
import assert from "node:assert/strict";
import { canShareImage, imageFileName } from "../lib/share-image.ts";

test("the file name uses the item id and the image type", () => {
  assert.equal(imageFileName("22222222222", "image/jpeg"), "oferta-22222222222.jpg");
  assert.equal(imageFileName("123", "image/png"), "oferta-123.png");
  assert.equal(imageFileName("123", "application/octet-stream"), "oferta-123.jpg");
});

test("odd characters never reach the file name", () => {
  assert.equal(imageFileName("../x/1", "image/webp"), "oferta-x1.webp");
  assert.equal(imageFileName("///", "image/jpeg"), "oferta-produto.jpg");
});

test("without a photo there is nothing to share as an image", () => {
  assert.equal(canShareImage(null, "texto"), false);
});
