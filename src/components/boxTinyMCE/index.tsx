import { Editor } from "@tinymce/tinymce-react";

import { Typography } from "antd";
const { Title } = Typography;

import "./boxTinyMCE.css";

interface props {
  label: string;
  initialValue: string;
  setValue: React.Dispatch<React.SetStateAction<string>>;
}

function BoxTinyMCE({ label, initialValue, setValue }: props) {
  return (
    <>
      <div className="box-tinyMCE">
        <Title level={5}>{label}</Title>
        <Editor
          apiKey="f0ejrfkxspsc9qymsehl5lu3hh5saqb48w5th54m1uoom2ox"
          value={initialValue}
          init={{
            height: 500,
            menubar: false,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "charmap",
              "preview",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "code",
              "help",
              "wordcount",
            ],
            toolbar:
              "undo redo | blocks | " +
              "bold italic forecolor | alignleft aligncenter " +
              "alignright alignjustify | bullist numlist outdent indent | " +
              "removeformat | help",
            content_style:
              "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          }}
          onEditorChange={setValue}
        />
      </div>
    </>
  );
}

export default BoxTinyMCE;
