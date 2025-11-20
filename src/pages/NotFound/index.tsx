import { Result } from "antd";

import ButtonGoBack from "@/components/ButtonGoBack";
import Header from "@/partials/Header";
import Footer from "@/partials/Footer";

function NotFound() {
  return (
    <>
      <Header />

      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={<ButtonGoBack />}
      />

      <Footer />
    </>
  );
}

export default NotFound;
