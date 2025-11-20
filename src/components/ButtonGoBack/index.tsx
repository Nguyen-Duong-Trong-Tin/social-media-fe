import { Button } from "antd";

function ButtonGoBack() {
  const handleGoBack = () => {
    window.history.back();
  }

  return (
    <Button type="primary" onClick={handleGoBack}>
      Go Back
    </Button>
  );
}

export default ButtonGoBack;