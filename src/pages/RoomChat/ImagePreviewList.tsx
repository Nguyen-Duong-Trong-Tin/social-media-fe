type ImagePreviewListProps = {
  imagePreviews: string[];
  onRemove: (index: number) => void;
};

function ImagePreviewList({ imagePreviews, onRemove }: ImagePreviewListProps) {
  if (!imagePreviews.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {imagePreviews.map((url, index) => (
        <div key={`${url}-${index}`} className="relative">
          <img
            src={url}
            alt="Selected"
            className="h-16 w-16 rounded-md object-cover"
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black/70 text-white text-xs leading-5 cursor-pointer"
            onClick={() => onRemove(index)}
            aria-label="Remove image"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default ImagePreviewList;

