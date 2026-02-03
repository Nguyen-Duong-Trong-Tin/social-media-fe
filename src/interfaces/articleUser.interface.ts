import type IBase from "./base.interface";

import type { EArticleUserStatus } from "@/enums/articleUser.enum";

interface IArticleUser extends IBase {
  title: string;
  slug: string;
  description: string;
  images: string[];
  videos: string[];
  status: EArticleUserStatus;
  createdBy: {
    userId: string;
    createdAt: Date;
  };
  deleted: boolean;
}

export default IArticleUser;
