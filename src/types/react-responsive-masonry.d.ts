declare module "react-responsive-masonry" {
  import { ComponentType, ReactNode } from "react";

  interface MasonryProps {
    columnsCount?: number;
    gutter?: string;
    children?: ReactNode;
  }

  interface ResponsiveMasonryProps {
    columnsCountBreakPoints?: Record<number, number>;
    children?: ReactNode;
  }

  export const ResponsiveMasonry: ComponentType<ResponsiveMasonryProps>;
  const Masonry: ComponentType<MasonryProps>;
  export default Masonry;
}
