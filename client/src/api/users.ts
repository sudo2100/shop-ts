import api from "./api"
import type { User, LoginForm, NewUser, UserUpdateForm } from "../types/user";

// 로그인 반환 타입 정의
interface LoginResponse{
    message: string;
    user: User;
}

// 로그인
export const requestLogin = async (loginForm: LoginForm) => {
    const response = 
        await api.post<LoginResponse>('/users/login', loginForm);
        return response.data.user;
}

// 회원 목록 조회
export const getUsers = async () => {
    const response = await api.get<User[]>('/users');
    return response.data;
}

// 회원 가입(id, role 자동 저장)
export const createUser = async (newUser: NewUser) => {
    const { username, password, name, email } = newUser;
    await api.post("/users", { username, password, name, email});
}

// 회원 정보 수정: 바뀐 회원정보를 돌려 받음
export const modifyUser = async (id: number, form: UserUpdateForm) => {
    const response = await api.put<User>(`/users/${id}`, form);
    return response.data;
}

// 로그인 확인(새로고침) - 세션에 남아있는 회원 정보 반환
export const getMe = async () => {
    const response = await api.get<User>('/users/me');
    return response.data;
}

// 로그아웃: 서버의 세션을 지운다.
export const requestLogout = async () => {
    await api.post('/users/logout');
}

