import { build } from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import React from "react";
import { renderToString } from "react-dom/server";
await mkdir(".cache", { recursive: true });
await build({
  entryPoints: ["src/App.jsx"],
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
  outfile: ".cache/App.mjs",
});
const { default: App } = await import("../.cache/App.mjs?build=" + Date.now());
const template = await readFile("dist/index.html", "utf8");
const isPublic = process.env.BENCHRELAY_PUBLIC === "1";
const routes = [
  [
    "/",
    "Benchrelay — Method-transfer readiness for testing laboratories",
    "Compare procedure requirements with receiving-laboratory equipment and records. Prepare evidence-linked method transfers for expert review.",
  ],
  [
    "/privacy",
    "Privacy — Benchrelay",
    "How the Benchrelay review website and browser-local sample demo handle information.",
  ],
  [
    "/terms",
    "Terms of use — Benchrelay",
    "Terms for exploring Benchrelay and its fictional method-transfer preparation demo.",
  ],
  [
    "/brand",
    "Brand assets — Benchrelay",
    "Original Benchrelay logos, symbols, favicon assets and downloadable brand files.",
  ],
  [
    "/404",
    "Page not found — Benchrelay",
    "The requested Benchrelay page could not be found.",
  ],
];
for (const [path, title, description] of routes) {
  let html = template.replace(
    '<div id="root"></div>',
    () =>
      `<div id="root">${renderToString(React.createElement(App, { path }))}</div>`,
  );
  const origin='https://benchrelay.top';
  const pageUrl=origin+(path==='/'?'/':path);
  html=html.replace(/<title>[\s\S]*?<\/title>/,()=>`<title>${title}</title>`);
  html=html.replace(/<meta\s+name="description"[^>]*>/,()=>`<meta name="description" content="${description}"/>`);
  html=html.replace(/<link\s+rel="canonical"[^>]*>/,()=>`<link rel="canonical" href="${pageUrl}"/>`);
  for(const [key,value] of Object.entries({'og:title':title,'og:description':description,'og:url':pageUrl,'og:image':origin+'/brand/social-preview.png'})){
    html=html.replace(new RegExp('<meta\\s+property="'+key+'"[^>]*>'),()=>`<meta property="${key}" content="${value}"/>`);
  }
  html = html.replace(
    'content="noindex, nofollow"',
    () =>
      `content="${isPublic && path !== "/404" ? "index, follow" : "noindex, nofollow"}"`,
  );
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Benchrelay",
    url: "https://benchrelay.top",
    email: "azeem@benchrelay.top",
    foundingDate: "2026",
    founder: [
      { "@type": "Person", name: "Azeem Salako" },
      { "@type": "Person", name: "Osahon Osagiede" },
    ],
    description:
      "B2B software for laboratory method-transfer preparation and expert review.",
  };
  html = html.replace(
    "</head>",
    () =>
      `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script></head>`,
  );
  if (path === "/" || path === "/404") {
    await writeFile("dist/" + (path === "/" ? "index.html" : "404.html"), html);
  } else {
    await mkdir("dist" + path, { recursive: true });
    await writeFile("dist" + path + "/index.html", html);
  }
}
await writeFile(
  "dist/robots.txt",
  isPublic
    ? "User-agent: *\nAllow: /\nSitemap: https://benchrelay.top/sitemap.xml\n"
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "dist/sitemap.xml",
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    routes
      .filter(([p]) => p !== "/404")
      .map(([p]) => `<url><loc>https://benchrelay.top${p}</loc></url>`)
      .join("") +
    "</urlset>",
);
console.log(
  "Prerendered home, legal, brand and 404. Indexing: " +
    (isPublic ? "PUBLIC" : "NOINDEX REVIEW"),
);
