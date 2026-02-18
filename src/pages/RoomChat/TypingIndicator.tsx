type TypingIndicatorProps = {
  isVisible: boolean;
};

function TypingIndicator({ isVisible }: TypingIndicatorProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="typing-dots" aria-label="Typing">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

export default TypingIndicator;
