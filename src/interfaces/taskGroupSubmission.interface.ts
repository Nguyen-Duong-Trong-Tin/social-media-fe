import type IBase from "./base.interface";

import { ETaskGroupSubmissionStatus } from "@/enums/taskGroupSubmission.enum";

interface ITaskGroupSubmission extends IBase {
  title: string;
  slug: string;
  description?: string;
  images: string[];
  videos: string[];
  materials: string[];
  status: ETaskGroupSubmissionStatus;
  taskGroupId: string;
  score: number;
  comment: string;
  scoredBy: string;
  scoredAt: Date;
  createdBy: {
    userId: string;
    createdAt: Date;
  };
  deleted: boolean;
}

export default ITaskGroupSubmission;
