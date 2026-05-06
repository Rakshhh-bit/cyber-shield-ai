const DEFAULT_API_URL = "https://cybershield-api-lbl4.onrender.com/api";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlash(
  process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_API ||
    DEFAULT_API_URL
);

export const SOCKET_URL = trimTrailingSlash(
  process.env.REACT_APP_SOCKET_URL ||
    API_BASE_URL.replace(/\/api$/, "")
);
