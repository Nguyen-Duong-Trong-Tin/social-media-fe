type VideoPreviewListProps = {
  videoPreviews: string[];
  onRemove: (index: number) => void;
};

function VideoPreviewList({ videoPreviews, onRemove }: VideoPreviewListProps) {
  if (!videoPreviews.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {videoPreviews.map((url, index) => (
        <div key={`${url}-${index}`} className="relative">
          <video
            src={url}
            className="h-16 w-16 rounded-md object-cover"
            muted
          />
          <button
            type="button"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-black/70 text-white text-xs leading-5 cursor-pointer"
            onClick={() => onRemove(index)}
            aria-label="Remove video"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default VideoPreviewList;

