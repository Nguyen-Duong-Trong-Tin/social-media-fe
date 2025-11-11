import type IBase from "./base.interface";

import type { EGroupRole, EGroupStatus } from "@/enums/group.enum";

interface IGroup extends IBase {
  title: string;
  slug: string;
  description: string;
  invitation: string;
  avatar: string;
  coverPhoto: string;
  status: EGroupStatus;
  users: {
    userId: string;
    role: EGroupRole;
  }[];
  userRequests: string[];
  usersInvited: string[];
  groupTopicId: string;
  deleted: boolean;
}

export default IGroup;
