import { createServer } from "http";
import sanitizeFilename from "sanitize-filename";
import { readFile, writeFile } from "fs/promises";
import { parseRequestBody } from "./parseRequestBody.js";
import { BlogLayout } from "./components/BlogLayout.js";
import { BlogIndexPage } from "./components/BlogIndexPage.js";
import { BlogPostPage } from "./components/BlogPostPage.js";

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
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
    await sendJSX(res, <Router url={url} />);
  } catch (err) {
    console.error(err);
    res.statusCode = err.statusCode ?? 500;
    res.end();
  }
}).listen(8081);

function Router({ url }) {
  let page;
  if (url.pathname === "/") {
    page = <BlogIndexPage />;
  } else {
    const postSlug = sanitizeFilename(url.pathname.slice(1));
    page = <BlogPostPage postSlug={postSlug} />;
  }
  return <BlogLayout>{page}</BlogLayout>;
}

async function sendJSX(res, jsx) {
  const clientJSX = await renderJSXToClientJSX(jsx);
  const clientJSXString = JSON.stringify(clientJSX, stringifyJSX);
  res.setHeader("Content-Type", "application/json");
  res.end(clientJSXString);
}

function stringifyJSX(key, value) {
  if (value === Symbol.for("react.element")) {
    return "$RE";
  } else if (typeof value === "string" && value.startsWith("$")) {
    return "$" + value;
  } else {
    return value;
  }
}

async function renderJSXToClientJSX(jsx) {
  if (
    typeof jsx === "string" ||
    typeof jsx === "number" ||
    typeof jsx === "boolean" ||
    jsx == null
  ) {
    /**
     * Don't need to do anything special with these types.
     */
    return jsx;
  } else if (Array.isArray(jsx)) {
    /**
     * Process each item in an array.
     */
    return Promise.all(jsx.map((child) => renderJSXToClientJSX(child)));
  } else if (jsx != null && typeof jsx === "object") {
    if (jsx.$$typeof === Symbol.for("react.element")) {
      if (typeof jsx.type === "string") {
        /**
         * This is a component like <div />.
         * Go over its props to make sure they can be turned into JSON.
         */
        return {
          ...jsx,
          props: await renderJSXToClientJSX(jsx.props),
        };
      } else if (jsx.type === Symbol.for("react.fragment")) {
        /**
         * This is a fragment like <>...</>.
         * Go over its children to make sure they can be turned into JSON.
         */
        return await renderJSXToClientJSX(jsx.props.children);
      } else if (typeof jsx.type === "function") {
        /**
         * This is a custom React component (like <Footer />).
         * Call its function, and repeat the procedure for the JSX it returns.
         */
        const Component = jsx.type;
        const props = jsx.props;
        const returnedJsx = await Component(props);
        return renderJSXToClientJSX(returnedJsx);
      } else throw new Error("Not implemented.");
    } else {
      /**
       * This is an arbitrary object (for example, props, or something inside of them).
       * Go over every value inside, and process it too in case there's some JSX in it.
       */
      return Object.fromEntries(
        await Promise.all(
          Object.entries(jsx).map(async ([propName, value]) => [
            propName,
            await renderJSXToClientJSX(value),
          ])
        )
      );
    }
  } else throw new Error("Not implemented");
}
