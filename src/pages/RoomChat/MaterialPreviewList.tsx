type MaterialPreviewListProps = {
  materials: string[];
  onRemove: (index: number) => void;
};

function MaterialPreviewList({ materials, onRemove }: MaterialPreviewListProps) {
  if (!materials.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {materials.map((name, index) => (
        <div
          key={`${name}-${index}`}
          className="flex items-center gap-2 rounded-md border border-gray-200 px-2 py-1 text-sm"
        >
          <span className="max-w-[220px] truncate">{name}</span>
          <button
            type="button"
            className="h-5 w-5 rounded-full bg-black/70 text-white text-xs leading-5 cursor-pointer"
            onClick={() => onRemove(index)}
            aria-label="Remove material"
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}

export default MaterialPreviewList;

