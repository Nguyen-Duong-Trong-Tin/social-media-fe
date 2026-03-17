import { ETaskGroupStatus } from "../enums/taskGroup.enum";

import type { IBase } from "./base.interface";

export interface ITaskGroup extends IBase {
  title: string;
  slug: string;
  description: string;
  images: string[];
  videos: string[];
  status: ETaskGroupStatus;
  groupId: string;
  createdBy: {
    userId: string;
    createdAt: Date;
  };
  deadline: Date;
  deleted: boolean;
}


