import { readFile } from "fs/promises";
import { Comment } from "./Comment.js";

function throwNotFound(cause) {
  const notFound = new Error("Not found.", { cause });
  notFound.statusCode = 404;
  throw notFound;
}

export async function Comments({ slug }) {
  let comments;
  try {
    const stringComments = await readFile(
      "./comments/" + slug + ".json",
      "utf8"
    );
    comments = JSON.parse(stringComments);
  } catch (err) {
    throwNotFound(err);
  }

  return (
    <section>
      <h1>comments</h1>

      <div>
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  );
}
