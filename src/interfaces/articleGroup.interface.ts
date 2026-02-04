import type IBase from "./base.interface";

import type { EArticleGroupStatus } from "@/enums/articleGroup.enum";

interface IArticleGroup extends IBase {
  title: string;
  slug: string;
  description: string;
  images: string[];
  videos: string[];
  status: EArticleGroupStatus;
  groupId: string;
  createdBy: {
    userId: string;
    createdAt: Date;
  };
  deleted: boolean;
}

export default IArticleGroup;
