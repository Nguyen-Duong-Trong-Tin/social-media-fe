import { SettingsIcon } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button, Dropdown, type MenuProps } from "antd";

import type ITaskGroup from "@/interfaces/taskGroup.interface";

import GroupProfileTasksButtonEdit from "./GroupProfileTasksButtonEdit";
import GroupProfileTasksButtonDelete from "./GroupProfileTasksButtonDelete";
import GroupProfileTasksScoring from "./GroupProfileTasksScoring";

function GroupProfileTasksSettings({
  taskGroup,
  setReload,
}: {
  taskGroup: ITaskGroup;
  setReload: Dispatch<SetStateAction<boolean>>;
}) {
  const items: MenuProps["items"] = [
    {
      key: "scoring",
      label: (
        <GroupProfileTasksScoring taskGroup={taskGroup} setReload={setReload} />
      ),
    },
    {
      key: "edit",
      label: (
        <GroupProfileTasksButtonEdit
          taskGroup={taskGroup}
          setReload={setReload}
        />
      ),
    },
    {
      key: "delete",
      label: (
        <GroupProfileTasksButtonDelete
          taskGroup={taskGroup}
          setReload={setReload}
        />
      ),
    },
  ];

  return (
    <>
      <Dropdown menu={{ items }}>
        <Button icon={<SettingsIcon />}>Settings</Button>
      </Dropdown>
    </>
  );
}

export default GroupProfileTasksSettings;
