export function Comment({ comment }) {
  return (
    <div style={{ border: "1px solid #ddd" }}>
      <p>{comment.content}</p>
      <span>
        {comment.author} : {comment.timestamp}
      </span>
    </div>
  );
}
