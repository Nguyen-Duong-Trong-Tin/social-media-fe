import type IGroup from "@/interfaces/group.interface";

import GroupProfileSettingsInvitation from "./GroupProfileSettingsInvitation";

function GroupProfileSettings({
  accessToken,
  group,
  setGroup,
}: {
  accessToken: string;
  group: IGroup | undefined;
  setGroup: React.Dispatch<React.SetStateAction<IGroup | undefined>>;
}) {
  return (
    <>
      <GroupProfileSettingsInvitation
        accessToken={accessToken}
        group={group}
        setGroup={setGroup}
      />
    </>
  );
}

export default GroupProfileSettings;
