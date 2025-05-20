import axios from "axios";

const baseURL = "http://192.168.0.115:3000/api";

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    }
});
export default axiosInstance;