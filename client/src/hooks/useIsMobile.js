import { Grid } from "antd";

// true below the `md` breakpoint (768px)
export const useIsMobile = () => {
  const screens = Grid.useBreakpoint();
  return screens.md === false;
};
