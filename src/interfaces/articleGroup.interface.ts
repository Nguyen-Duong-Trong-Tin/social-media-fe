import type { IBase } from "./base.interface";

import type { EArticleGroupStatus } from "@/enums/articleGroup.enum";

export interface IArticleGroup extends IBase {
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
  likes?: {
    userId: string;
    createdAt: Date | string;
  }[];
  comments?: {
    _id?: string;
    userId: string;
    content: string;
    createdAt: Date | string;
    updatedAt: Date | string;
  }[];
  deleted: boolean;
}
