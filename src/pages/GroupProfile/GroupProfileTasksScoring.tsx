import { toast } from "react-toastify";
import { Button, Input, Modal } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SolutionOutlined } from "@ant-design/icons";

import { cn } from "@/lib/utils";
import { formatDate } from "@/helpers/date";
import { getCookie } from "@/helpers/cookies";
import { Badge } from "@/components/ui/badge";
import type ITaskGroup from "@/interfaces/taskGroup.interface";
import { findTaskGroupSubmissions } from "@/services/taskGroupSubmission";
import type ITaskGroupSubmission from "@/interfaces/taskGroupSubmission.interface";

const { Search } = Input;

function GroupProfileTasksScoring({
  taskGroup,
  setReload,
}: {
  taskGroup: ITaskGroup;
  setReload: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const accessToken = getCookie("accessToken");

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [
    searchTaskGroupSubmissionsByTitle,
    setSearchTaskGroupSubmissionsByTitle,
  ] = useState("");
  const [taskGroupSubmissions, setTaskGroupSubmissions] = useState<
    ITaskGroupSubmission[]
  >([]);

  useEffect(() => {
    const fetchApi = async () => {
      try {
        const {
          data: {
            data: { taskGroupSubmissions },
          },
        } = await findTaskGroupSubmissions({
          accessToken,
          filter: {
            taskGroupId: taskGroup._id,
            title: searchTaskGroupSubmissionsByTitle,
          },
        });

        setTaskGroupSubmissions(taskGroupSubmissions.items);
      } catch {
        toast.error("Something went wrong");
      }
    };
    fetchApi();
  }, [accessToken, taskGroup._id, searchTaskGroupSubmissionsByTitle]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handleNavigateToTaskGroupSubmission = ({
    taskGroupSubmissionSlug,
  }: {
    taskGroupSubmissionSlug: string;
  }) => {
    navigate(`/group-profile/scoring/${taskGroupSubmissionSlug}`);
  };

  return (
    <>
      <Modal
        title="List of submissions"
        closable={{ "aria-label": "Custom Close Button" }}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
      >
        <Search
          placeholder={"Search task group submissions..."}
          value={searchTaskGroupSubmissionsByTitle}
          onChange={(e) => {
            setSearchTaskGroupSubmissionsByTitle(e.target.value);
          }}
          allowClear
          enterButton={false}
          size="large"
          style={{ borderRadius: 9999 }}
        />

        {taskGroupSubmissions.map((taskGroupSubmission) => (
          <div
            key={taskGroupSubmission._id}
            onClick={() =>
              handleNavigateToTaskGroupSubmission({
                taskGroupSubmissionSlug: taskGroupSubmission.slug,
              })
            }
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-md border hover:bg-gray-50 transition cursor-pointer mt-3"
            )}
          >
            <div className="flex items-center space-x-3">
              <SolutionOutlined className="text-xl text-gray-700" />
              <span className="text-[16px] font-medium">
                {taskGroupSubmission.title}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <Badge
                variant="secondary"
                className="text-sm bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md mb-2"
              >
                Score:{" "}
                {taskGroupSubmission.score === -1
                  ? "unread"
                  : taskGroupSubmission.score}
              </Badge>
              <Badge
                variant="secondary"
                className="text-sm bg-gray-100 text-gray-700 font-medium px-2.5 py-1 rounded-md"
              >
                Updated at: {formatDate(taskGroupSubmission.updatedAt)}
              </Badge>
            </div>
          </div>
        ))}
      </Modal>

      <Button htmlType="submit" onClick={showModal}>
        Scoring
      </Button>
    </>
  );
}

export default GroupProfileTasksScoring;
