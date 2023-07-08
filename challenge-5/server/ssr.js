import { createServer } from "http";
import { renderToString } from "react-dom/server";
import { readFile, writeFile } from "fs/promises";
import getStaticAsset from "./getStaticAsset.js";

/**
 * This is a server to host CDN distributed resources like static files and SSR.
 */
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.includes(".")) {
      await getStaticAsset(url.pathname, res);
      return;
    }
    if (req.url === "/api/comment" && req.method === "POST") {
      const body = await parseRequestBody(req);
      const commentsData = await readFile(
        `./comments/${body.slug}.json`,
        "utf8"
      );
      const comments = JSON.parse(commentsData);
      const newComment = {
        id: comments.at(-1).id + 1,
        content: body.content,
        author: body.author,
        timestamp: new Date().toISOString(),
      };
      comments.push(newComment);
      const commentsFile = `./comments/${body.slug}.json`;
      await writeFile(commentsFile, JSON.stringify(comments, null, 2));
      res.setHeader("Location", "/" + body.slug);
      res.statusCode = 303;
      res.end();
      return;
    }
    /**
     * Get the serialized JSX response from the RSC server
     */
    const response = await fetch("http://127.0.0.1:8081" + url.pathname);
    if (!response.ok) {
      res.statusCode = response.status;
      res.end();
      return;
    }
    const clientJSXString = await response.text();
    if (url.searchParams.has("jsx")) {
      /**
       * If the user is navigating between pages, send that serialized JSX as is
       */
      res.setHeader("Content-Type", "application/json");
      res.end(clientJSXString);
    } else {
      /**
       * If this is an initial page load, revive the tree and turn it into HTML
       */

      // 1. Let's turn <Router /> into <html>...</html> (an object) first:
      const clientJSX = JSON.parse(clientJSXString, parseJSX);
      // 2. Turn that <html>...</html> into "<html>...</html>" (a string):
      let html = renderToString(clientJSX);

      html += `<script>window.__INITIAL_CLIENT_JSX_STRING__ = `;
      html += JSON.stringify(clientJSXString).replace(/</g, "\\u003c");
      html += `</script>`;
      html += `
        <script type="importmap">
          {
            "imports": {
              "react": "https://esm.sh/react@canary",
              "react-dom/client": "https://esm.sh/react-dom@canary/client"
            }
          }
        </script>
        <script type="module" src="/client.js"></script>
      `;
      res.setHeader("Content-Type", "text/html");
      res.end(html);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8080);

async function parseRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  return JSON.parse(buffer.toString());
}

function parseJSX(key, value) {
  if (value === "$RE") {
    return Symbol.for("react.element");
  } else if (typeof value === "string" && value.startsWith("$$")) {
    return value.slice(1);
  } else {
    return value;
  }
}
