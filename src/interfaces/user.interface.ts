import type IBase from "./base.interface";

import { EUserOnline, EUserStatus } from "../enums/user.enum";

interface IUser extends IBase {
  fullName: string;
  slug: string;
  email: string;
  password: string;
  phone: string;
  avatar: string;
  status: EUserStatus;
  coverPhoto: string;
  bio: string;
  friends: {
    userId: string;
    roomChatId: string;
  }[];
  friendAccepts: string[];
  friendRequests: string[];
  online: EUserOnline;
  deleted: boolean;
}

export default IUser;
