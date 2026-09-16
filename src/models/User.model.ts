export interface User {
    id: string;
    name: string;
    phone_no: string;
    email: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
}

export interface UserWithPassword {
    id: string;
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
    id: string,
    password: string;
}

export interface UpdatePhoneNumber {
    id: string;
    phone_no: string;
}

export interface UpdateEmail {
    id: string;
    email: string;
}

export interface UserId {
    id: string;
}

export interface JwtTokenPayload {
    userId: string;
    sessionId: string;
    email: string;
    name: string;
}