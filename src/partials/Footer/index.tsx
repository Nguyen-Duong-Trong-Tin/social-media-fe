import { FacebookFilled, InstagramFilled } from "@ant-design/icons";

function Footer() {
  return (
    <footer className="bg-[#1877f2] text-white py-4 px-6 rounded-t-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-white" />
          <span className="text-lg font-semibold">EduS</span>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          <span>©2025 EduSocial. All rights reserved.</span>
          <div className="flex space-x-2">
            <a
              href="https://www.facebook.com/tin.nodejs"
              className="w-8 h-8 flex items-center justify-center bg-[#3557b7] rounded-full hover:opacity-90"
            >
              <FacebookFilled style={{ fontSize: "18px", color: "white" }} />
            </a>
            <a
              href="https://www.instagram.com/tin963145/"
              className="w-8 h-8 flex items-center justify-center rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
              }}
            >
              <InstagramFilled style={{ fontSize: "18px", color: "white" }} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
