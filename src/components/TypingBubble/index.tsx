import { Avatar, Flex } from "antd";

import { UserOutlined } from "@ant-design/icons";

function TypingBubble() {
  return (
    <Flex gap="small">
      <Avatar icon={<UserOutlined />} />

      <div className="ml-1 px-3 py-2 rounded-2xl bg-gray-200 w-fit flex items-center gap-1">
        <span className="animate-bounce delay-0">•</span>
        <span className="animate-bounce delay-150">•</span>
        <span className="animate-bounce delay-300">•</span>
      </div>
    </Flex>
  );
}

export default TypingBubble;
