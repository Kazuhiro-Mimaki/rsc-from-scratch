import sizeOf from "image-size";

export function Image({ src, alt }) {
  const img = sizeOf(`./static/images/${src}`);
  const { width, height } = {
    width: img.height / 20,
    height: img.width / 20,
  };
  return <img src={`/images/${src}`} alt={alt} width={width} height={height} />;
}
