import type { IBase } from "./base.interface";

export interface IGroupTopic extends IBase {
  title: string;
  slug: string;
  description: string;
  deleted: boolean;
};

