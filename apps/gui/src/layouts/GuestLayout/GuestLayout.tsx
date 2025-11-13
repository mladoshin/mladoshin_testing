import classNames from "classnames";
import { ReactNode, useEffect } from "react";
import styles from "./GuestLayout.module.scss";
import GuestHeader from "@/widgets/Header/GuestHeader";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/model/store";

interface Props {
  children: ReactNode;
}

export const GuestLayout = ({ children }: Props) => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/academy");
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <GuestHeader />
      <main className={classNames(styles.main, "py-5")}>{children}</main>
    </div>
  );
};
