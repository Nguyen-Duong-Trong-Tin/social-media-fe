import type IBase from "./base.interface";

interface IGroupTopic extends IBase {
  title: string;
  slug: string;
  description: string;
  deleted: boolean;
};

export default IGroupTopic;