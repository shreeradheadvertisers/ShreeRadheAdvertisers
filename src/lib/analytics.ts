import ReactGA from "react-ga4";

const GA_MEASUREMENT_ID = "G-Y0B6G27337"; 

export const initGA = () => {
  // Initialize GA4 only once
  if (!window.location.href.includes("localhost")) {
    ReactGA.initialize(GA_MEASUREMENT_ID);
  } else {
    // Optional: Log to console in dev mode so you know it's working
    console.log("GA4 Initialized (Dev Mode)");
  }
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};