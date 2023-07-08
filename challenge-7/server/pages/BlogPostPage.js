import { Post } from "../components/Post.js";
import { Comments } from "../components/Comments.js";
import { CommentForm } from "../components/CommentForm.js";

export function BlogPostPage({ postSlug }) {
  return (
    <>
      <Post slug={postSlug} />
      <Comments slug={postSlug} />
      <CommentForm slug={postSlug} />
    </>
  );
}
