// import axios from "axios";

// const api = axios.create({
//   baseURL: "http://192.168.87.41:8002/api/", // IP PC
// });

// export const setAuthToken = (token) => {
//   api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
// };

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "http://192.168.87.41:8002/", // Ton IP backend Django
});

export default api;
