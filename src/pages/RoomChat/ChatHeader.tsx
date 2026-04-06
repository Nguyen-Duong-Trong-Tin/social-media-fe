import { Avatar, Button, Tooltip } from "antd";
import {
  PhoneOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

import type { IUser } from "@/interfaces/user.interface";

type ChatHeaderProps = {
  friend?: IUser;
  onCallAudio?: () => void;
  onCallVideo?: () => void;
};

function ChatHeader({ friend, onCallAudio, onCallVideo }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <Avatar
          src={friend?.avatar}
          icon={!friend?.avatar ? <UserOutlined /> : undefined}
        />
        <div>
          <h2 className="text-xl font-bold">
            {friend?.fullName || "Room Chat"}
          </h2>
          <p className="text-gray-500 text-sm">Chat in real-time</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip title="Audio call">
          <Button
            shape="circle"
            icon={<PhoneOutlined />}
            onClick={onCallAudio}
          />
        </Tooltip>
        <Tooltip title="Video call">
          <Button
            shape="circle"
            icon={<VideoCameraOutlined />}
            onClick={onCallVideo}
          />
        </Tooltip>
      </div>
    </div>
  );
}

export default ChatHeader;
