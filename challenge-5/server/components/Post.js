import { readFile } from "fs/promises";
import ReactMarkdown from "react-markdown";
import { Image } from "./Image.js";

function throwNotFound(cause) {
  const notFound = new Error("Not found.", { cause });
  notFound.statusCode = 404;
  throw notFound;
}

export async function Post({ slug }) {
  let content;
  try {
    content = await readFile("./posts/" + slug + ".md", "utf8");
  } catch (err) {
    throwNotFound(err);
  }
  return (
    <section>
      <h2>
        <a href={"/" + slug}>{slug}</a>
      </h2>
      <ReactMarkdown components={{ img: Image }}>{content}</ReactMarkdown>
    </section>
  );
}
