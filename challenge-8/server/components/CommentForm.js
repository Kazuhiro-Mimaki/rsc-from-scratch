export function CommentForm({ slug }) {
  return (
    <form method="POST" action="/api/comment">
      <h2>Add a comment:</h2>
      <input name="author" placeholder="name" />
      <br />
      <textarea name="content" placeholder="content" />
      <br />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit">Submit</button>
    </form>
  );
}
