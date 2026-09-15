export interface User {
    id: number;
    name: string;
    phone_no: string;
    email: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
}

export interface UserWithPassword {
    id: number;
    name: string;
    phone_no: string;
    email: string;
    password: string;
}

export interface CreateUser {
    name: string;
    phone_no: string;
    email: string;
    password: string;
}

export interface UpdatePassword {
    id: number;
    password: string;
}

export interface UpdatePhoneNumber {
    id: number;
    phone_no: string;
}

export interface UpdateEmail {
    id: number;
    email: string;
}

export interface UserId {
    id: number;
}

export interface JwtTokenPayload {
    id: string;
    email: string;
    name: string;
}