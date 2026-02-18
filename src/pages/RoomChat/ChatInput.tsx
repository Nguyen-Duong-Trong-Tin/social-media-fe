import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Button, Input, Popover } from "antd";
import {
  PictureOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import "emoji-picker-element";

const { TextArea } = Input;

type ChatInputProps = {
  message: string;
  onMessageChange: (value: string) => void;
  onMessageBlur: () => void;
  onMessageKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onImagesSelected: (files: File[]) => void;
  onSend: () => void;
  isSending: boolean;
  isUploadingImage: boolean;
};

function ChatInput({
  message,
  onMessageChange,
  onMessageBlur,
  onMessageKeyDown,
  onImagesSelected,
  onSend,
  isSending,
  isUploadingImage,
}: ChatInputProps) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const picker = emojiPickerRef.current;

    if (!picker) {
      return;
    }

    const handleEmojiClick = (event: Event) => {
      const detail = (event as CustomEvent<{ unicode?: string; emoji?: string }>).
        detail;
      const nextEmoji = detail?.unicode ?? detail?.emoji;

      if (!nextEmoji) {
        return;
      }

      onMessageChange(`${message}${nextEmoji}`);
    };

    picker.addEventListener("emoji-click", handleEmojiClick as EventListener);

    return () => {
      picker.removeEventListener(
        "emoji-click",
        handleEmojiClick as EventListener
      );
    };
  }, [isEmojiOpen, message, onMessageChange]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (!files.length) {
      return;
    }

    onImagesSelected(files);

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <TextArea
        value={message}
        onChange={(event) => onMessageChange(event.target.value)}
        onBlur={onMessageBlur}
        onKeyDown={onMessageKeyDown}
        autoSize={{ minRows: 2, maxRows: 6 }}
        placeholder="Type your message..."
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageChange}
      />
      <Button
        icon={<PictureOutlined />}
        onClick={() => imageInputRef.current?.click()}
        loading={isUploadingImage}
        aria-label="Upload image"
      />
      <Popover
        trigger="click"
        open={isEmojiOpen}
        onOpenChange={setIsEmojiOpen}
        content={
          <div className="max-w-[360px]">
            {/* @ts-ignore: custom element */}
            <emoji-picker ref={emojiPickerRef} />
          </div>
        }
      >
        <Button icon={<SmileOutlined />} aria-label="Insert emoji" />
      </Popover>
      <Button
        type="primary"
        loading={isSending}
        onClick={onSend}
        icon={<SendOutlined />}
        aria-label="Send message"
      >
      </Button>
    </div>
  );
}

export default ChatInput;
