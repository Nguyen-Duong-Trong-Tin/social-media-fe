import { Image } from "antd";

import type IGroup from "@/interfaces/group.interface";

function GroupProfileHeader({ group }: { group?: IGroup }) {
  return (
    <>
      <div className="cover-photo">
        {group && (
          <Image
            src={
              group.coverPhoto
                ? group.coverPhoto
                : "https://cellphones.com.vn/sforum/wp-content/uploads/2024/04/anh-bia-facebook-3.jpg"
            }
          />
        )}
      </div>

      <div className="avatar">
        <div className="avatar-container">
          {group && (
            <Image
              className="avatar-image"
              src={
                group.avatar
                  ? group.avatar
                  : "https://aic.com.vn/wp-content/uploads/2024/10/avatar-fb-mac-dinh-2.jpg"
              }
            />
          )}
        </div>
      </div>

      <div className="full-name">
        <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
          {group && group.title}
        </h2>
      </div>
    </>
  );
}

export default GroupProfileHeader;
