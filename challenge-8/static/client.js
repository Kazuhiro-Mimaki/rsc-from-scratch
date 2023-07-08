import { hydrateRoot } from "react-dom/client";

const root = hydrateRoot(document, getInitialClientJSX());
let currentPathname = window.location.pathname;

const jsxCache = new Map();

async function navigate(pathname) {
  currentPathname = pathname;

  if (jsxCache.get(currentPathname)) {
    root.render(jsxCache.get(currentPathname));
  } else {
    const clientJSX = await fetchClientJSX(pathname);
    jsxCache.set(currentPathname, clientJSX);
    if (pathname === currentPathname) {
      root.render(clientJSX);
    }
  }
}

async function navigate(pathname) {
  currentPathname = pathname;
  const clientJSX = await fetchClientJSX(pathname);
  if (pathname === currentPathname) {
    root.render(clientJSX);
  }
}

function getInitialClientJSX() {
  const clientJSX = JSON.parse(window.__INITIAL_CLIENT_JSX_STRING__, parseJSX);
  return clientJSX;
}

async function fetchClientJSX(pathname) {
  const response = await fetch(pathname + "?jsx");
  const clientJSXString = await response.text();
  const clientJSX = JSON.parse(clientJSXString, parseJSX);
  return clientJSX;
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

window.addEventListener(
  "click",
  (e) => {
    if (e.target.tagName !== "A") {
      return;
    }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return;
    }
    const href = e.target.getAttribute("href");
    if (!href.startsWith("/")) {
      return;
    }
    e.preventDefault();
    window.history.pushState(null, null, href);
    navigate(href);
  },
  true
);

window.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const body = Object.fromEntries(formData.entries());
  await fetch("/api/comment", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  });
  navigate(window.location.pathname);
});

window.addEventListener("popstate", () => {
  navigate(window.location.pathname);
});
