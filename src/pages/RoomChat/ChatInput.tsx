import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Button, Input, Popover } from "antd";
import {
  PictureOutlined,
  PaperClipOutlined,
  VideoCameraOutlined,
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
  onVideosSelected: (files: File[]) => void;
  onMaterialsSelected: (files: File[]) => void;
  onSend: () => void;
  isSending: boolean;
  isUploadingImage: boolean;
  isUploadingVideo: boolean;
  isUploadingMaterial: boolean;
};

function ChatInput({
  message,
  onMessageChange,
  onMessageBlur,
  onMessageKeyDown,
  onImagesSelected,
  onVideosSelected,
  onMaterialsSelected,
  onSend,
  isSending,
  isUploadingImage,
  isUploadingVideo,
  isUploadingMaterial,
}: ChatInputProps) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const materialInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (!files.length) {
      return;
    }

    onVideosSelected(files);

    if (videoInputRef.current) {
      videoInputRef.current.value = "";
    }
  };

  const handleMaterialChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];

    if (!files.length) {
      return;
    }

    onMaterialsSelected(files);

    if (materialInputRef.current) {
      materialInputRef.current.value = "";
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
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        onChange={handleVideoChange}
      />
      <input
        ref={materialInputRef}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={handleMaterialChange}
      />
      <Button
        icon={<PictureOutlined />}
        onClick={() => imageInputRef.current?.click()}
        loading={isUploadingImage}
        disabled={
          isSending ||
          isUploadingImage ||
          isUploadingVideo ||
          isUploadingMaterial
        }
        aria-label="Upload image"
      />
      <Button
        icon={<VideoCameraOutlined />}
        onClick={() => videoInputRef.current?.click()}
        loading={isUploadingVideo}
        disabled={
          isSending ||
          isUploadingImage ||
          isUploadingVideo ||
          isUploadingMaterial
        }
        aria-label="Upload video"
      />
      <Button
        icon={<PaperClipOutlined />}
        onClick={() => materialInputRef.current?.click()}
        loading={isUploadingMaterial}
        disabled={
          isSending ||
          isUploadingImage ||
          isUploadingVideo ||
          isUploadingMaterial
        }
        aria-label="Upload material"
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
        disabled={
          isSending ||
          isUploadingImage ||
          isUploadingVideo ||
          isUploadingMaterial
        }
      >
      </Button>
    </div>
  );
}

export default ChatInput;
