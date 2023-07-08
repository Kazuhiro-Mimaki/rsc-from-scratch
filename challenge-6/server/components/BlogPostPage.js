import { Post } from "./Post.js";
import { Comments } from "./Comments.js";
import { CommentForm } from "./CommentForm.js";

export function BlogPostPage({ postSlug }) {
  return (
    <>
      <Post slug={postSlug} />
      <Comments slug={postSlug} />
      <CommentForm slug={postSlug} />
    </>
  );
}
