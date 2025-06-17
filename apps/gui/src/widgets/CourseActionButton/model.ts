import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface CourseActionButtonModelProps {
  handleAction?: (
    courseId: string,
    action: "register" | "pay"
  ) => Promise<void>;
}
export const useCourseActionButtonModel = ({
  handleAction,
}: CourseActionButtonModelProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState({
    register: false,
    pay: false,
  });

  const handleChangeLoading = (action: "register" | "pay", value: boolean) => {
    setLoading((prev) => ({
      ...prev,
      [action]: value,
    }));
  };

  const handleRegisterButtonClick = async (courseId: string) => {
    handleChangeLoading("register", true);
    try {
      await handleAction?.(courseId, "register");
    } catch (error) {
      console.error("Ошибка при регистрации на курс:", error);
    }
    handleChangeLoading("register", false);
  };

  const handleOpenButtonClick = async (courseId: string) => {
    navigate(`/academy/courses/${courseId}`);
  };

  const handlePayButtonClick = async (courseId: string) => {
    handleChangeLoading("pay", true);
    try {
      await handleAction?.(courseId, "pay");
    } catch (error) {
      console.error("Ошибка при оплате курса:", error);
    }
    handleChangeLoading("pay", false);
  };

  return {
    loading,
    handleRegisterButtonClick,
    handlePayButtonClick,
    handleOpenButtonClick
  };
};
