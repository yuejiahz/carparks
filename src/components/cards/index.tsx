import { PropsWithChildren } from "react";

import "./index.css";

export const Card: React.FC<PropsWithChildren> = ({ children, ...props }) => {
  return (
    <div className="card" {...props}>
      {children}
    </div>
  );
};
