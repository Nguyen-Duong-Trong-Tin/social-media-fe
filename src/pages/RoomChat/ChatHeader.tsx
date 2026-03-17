import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

import type { IUser } from "@/interfaces/user.interface";

type ChatHeaderProps = {
  friend?: IUser;
};

function ChatHeader({ friend }: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
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
  );
}

export default ChatHeader;

