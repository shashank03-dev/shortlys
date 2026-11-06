import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QRCodeSVG } from "qrcode.react";
import { PNG } from "pngjs";
import jsQR from "jsqr";

const payload = "http://localhost:3100/print-menu?src=qr";

test.beforeEach(async ({ page }) => {
  const helper = await readFile("lib/qr/download.js", "utf8");
  await page.route("**/__export-helper.js", (route) => route.fulfill({ contentType: "text/javascript", body: helper }));
  await page.goto("/qr", { waitUntil: "domcontentloaded" });
});

for (const [size, level] of [[512, "M"], [1024, "M"], [2048, "Q"], [4096, "H"]]) {
  test(`downloaded ${size}px PNG decodes to the short QR URL`, async ({ page }) => {
    test.setTimeout(60000);
    const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, {
      value: payload, size: 224, level, marginSize: 4, boostLevel: false, fgColor: "#14532D", bgColor: "#F0FDF4",
    }));
    await page.evaluate((markup) => { document.querySelector("main").innerHTML = markup; }, svg);
    const downloaded = page.waitForEvent("download");
    await page.evaluate(async (size) => {
      const { downloadPng } = await import("/__export-helper.js");
      await downloadPng(document.querySelector("main svg"), "print-menu", size, "#F0FDF4");
    }, size);
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe("shortlys-print-menu.png");
    const png = PNG.sync.read(await readFile(await download.path()));
    expect([png.width, png.height]).toEqual([size, size]);
    expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(payload);
  });
}

test("downloaded SVG preserves size and decodes after rasterization", async ({ page }) => {
  const svg = renderToStaticMarkup(React.createElement(QRCodeSVG, { value: payload, size: 224, marginSize: 4 }));
  await page.evaluate((markup) => { document.querySelector("main").innerHTML = markup; }, svg);
  const downloaded = page.waitForEvent("download");
  await page.evaluate(async () => {
    const { downloadSvg } = await import("/__export-helper.js");
    downloadSvg(document.querySelector("main svg"), "print-menu", 1024);
  });
  const output = await readFile(await (await downloaded).path(), "utf8");
  expect(output).toContain('width="1024"');
  await page.setContent(output.replace(/^<\?xml[^>]*>\s*/, ""));
  await page.locator("svg").evaluate((node) => { node.style.width = "512px"; node.style.height = "512px"; });
  const png = PNG.sync.read(await page.locator("svg").screenshot());
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(payload);
});
