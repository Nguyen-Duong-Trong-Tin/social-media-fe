import type IGroup from "@/interfaces/group.interface";

import GroupProfileSettingsInvitation from "./GroupProfileSettingsInvitation";
import GroupProfileSettingsLeaveGroup from "./GroupProfileSettingsLeaveGroup";
import { getCookie } from "@/helpers/cookies";
import { Card } from "antd";

function GroupProfileSettings({
  accessToken,
  group,
  setGroup,
}: {
  accessToken: string;
  group: IGroup | undefined;
  setGroup: React.Dispatch<React.SetStateAction<IGroup | undefined>>;
}) {
  const userId = getCookie("userId");

  return (
    <>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-3">List Of Settings</h2>

        {group &&
          group.users.some(
            (user) =>
              user.userId === userId &&
              (user.role === "superAdmin" || user.role === "admin")
          ) && (
            <GroupProfileSettingsInvitation
              accessToken={accessToken}
              group={group}
              setGroup={setGroup}
            />
          )}

        <GroupProfileSettingsLeaveGroup
          accessToken={accessToken}
          group={group}
        />
      </Card>
    </>
  );
}

export default GroupProfileSettings;
