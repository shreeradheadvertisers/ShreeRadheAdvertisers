import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, key } = useLocation();

  useEffect(() => {
    // Scrolls to the top of the page on route change or when the same link is clicked
    window.scrollTo(0, 0);
  }, [pathname, key]);

  return null;
}