import { Modal } from "antd";
import React, { useEffect, useRef, useState } from "react";

interface Props {
  src: string;
  thumbnail?: string;
  resetWhenClose?: boolean;
}

const VideoWithPreview: React.FC<Props> = ({ src, thumbnail, resetWhenClose = true }) => {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const showModal = () => {
    if (!src) return;
    setOpen(true);
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (resetWhenClose) videoRef.current.currentTime = 0;
    }
    setOpen(false);
  };

  const afterClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      if (resetWhenClose) videoRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    if (open && videoRef.current) {
    }
  }, [open]);

  return (
    <>
      <div
        className="w-full aspect-square overflow-hidden cursor-pointer bg-gray-200"
        onClick={showModal}
      >
        {thumbnail ? (
          <img src={thumbnail} className="w-full h-full object-cover" />
        ) : (
          <video src={src} className="w-full h-full object-cover" muted playsInline />
        )}
      </div>

      <Modal
        open={open}
        onCancel={handleClose}
        afterClose={afterClose}
        footer={null}
        width="70vw"
        destroyOnClose={true}
      >
        <video ref={videoRef} src={src} controls className="w-full mt-7" />
      </Modal>
    </>
  );
};

export default VideoWithPreview;
