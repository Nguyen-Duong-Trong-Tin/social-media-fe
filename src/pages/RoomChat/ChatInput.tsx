import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { Avatar, Button, Input, Popover } from "antd";
import type { TextAreaRef } from "antd/es/input/TextArea";
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
  mentionCandidates?: { id: string; fullName?: string; avatar?: string }[];
  enableMentions?: boolean;
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
  mentionCandidates = [],
  enableMentions = false,
}: ChatInputProps) {
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const emojiPickerRef = useRef<HTMLElement | null>(null);
  const textAreaRef = useRef<TextAreaRef | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const materialInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedMentionCandidates = useMemo(() => {
    return mentionCandidates.filter((candidate) => candidate.id);
  }, [mentionCandidates]);

  const filteredMentions = useMemo(() => {
    const query = mentionQuery.trim().toLowerCase();
    if (!query) {
      return normalizedMentionCandidates;
    }

    return normalizedMentionCandidates.filter((candidate) =>
      (candidate.fullName || "").toLowerCase().includes(query)
    );
  }, [mentionQuery, normalizedMentionCandidates]);

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

  const updateMentionState = (value: string, cursorPos: number) => {
    if (!enableMentions) {
      setIsMentionOpen(false);
      return;
    }

    const mentionIndex = value.lastIndexOf("@", Math.max(cursorPos - 1, 0));
    if (mentionIndex === -1) {
      setIsMentionOpen(false);
      return;
    }

    const charBefore = mentionIndex > 0 ? value[mentionIndex - 1] : "";
    if (mentionIndex > 0 && /[\w]/.test(charBefore)) {
      setIsMentionOpen(false);
      return;
    }

    const query = value.slice(mentionIndex + 1, cursorPos);
    if (query.includes(" ") || query.includes("\n")) {
      setIsMentionOpen(false);
      return;
    }

    setMentionQuery(query);
    setIsMentionOpen(true);
  };

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value;
    onMessageChange(nextValue);
    updateMentionState(nextValue, event.target.selectionStart ?? nextValue.length);
  };

  const handleTextKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && isMentionOpen) {
      setIsMentionOpen(false);
      return;
    }

    onMessageKeyDown(event);
  };

  const handleTextBlur = () => {
    onMessageBlur();
    setIsMentionOpen(false);
  };

  const resolveTextArea = () =>
    textAreaRef.current?.resizableTextArea?.textArea || null;

  const handleMentionSelect = (fullName?: string) => {
    if (!fullName) {
      return;
    }

    const input = resolveTextArea();
    const cursorPos = input?.selectionStart ?? message.length;
    const mentionIndex = message.lastIndexOf("@", Math.max(cursorPos - 1, 0));
    if (mentionIndex === -1) {
      return;
    }

    const before = message.slice(0, mentionIndex);
    const after = message.slice(cursorPos);
    const insert = `@${fullName} `;
    const nextValue = `${before}${insert}${after}`;
    onMessageChange(nextValue);
    setIsMentionOpen(false);
    setMentionQuery("");

    requestAnimationFrame(() => {
      const nextInput = resolveTextArea();
      if (nextInput) {
        const nextCursor = before.length + insert.length;
        nextInput.focus();
        nextInput.setSelectionRange(nextCursor, nextCursor);
      }
    });
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <div className="relative flex-1">
        <TextArea
          ref={textAreaRef}
          value={message}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          autoSize={{ minRows: 2, maxRows: 6 }}
          placeholder="Type your message..."
          className="w-full"
        />
        {isMentionOpen && filteredMentions.length > 0 && (
          <div className="absolute left-0 right-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {filteredMentions.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-100"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleMentionSelect(candidate.fullName)}
              >
                <Avatar
                  size={24}
                  src={candidate.avatar}
                >
                  {candidate.fullName?.[0]}
                </Avatar>
                <span className="text-sm text-slate-700">
                  {candidate.fullName || "Unknown"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
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
