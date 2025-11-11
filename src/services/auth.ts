import axios from "axios";

const v1 = import.meta.env.VITE_BACKEND_V1;

export const authRegister = async ({
  fullName,
  email,
  phone,
  password,
  confirmPassword,
}: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}) => {
  const response = await axios.post(`${v1}/auth/register`, {
    fullName,
    email,
    phone,
    password,
    confirmPassword,
  });
  return response;
};

export const authLogin = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const response = await axios.post(`${v1}/auth/login`, { email, password });
  return response;
};

export const authVerifyAccessToken = async ({
  accessToken,
}: {
  accessToken: string;
}) => {
  const response = await axios.get(`${v1}/auth/verify-access-token`, {
    headers: { accessToken },
  });
  return response;
};

export const authRefreshToken = async ({
  refreshToken,
}: {
  refreshToken: string;
}) => {
  const response = await axios.post(`${v1}/auth/refresh-token`, {
    refreshToken,
  });
  return response;
};
