export interface User {
    id: string;
    name: string;
    phone_no: string;
    email: string;
    verified: boolean;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
}

export interface UserWithPassword {
    id: string;
    name: string;
    phone_no: string;
    verified: boolean;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
    last_login: Date | null;
}

export interface CreateUser {
    name: string;
    phone_no: string;
    email: string;
    password: string;
}

export interface UpdatePassword {
    id: string;
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

export type SignupRegistrationStatus =
    "EMAIL_PENDING" | "PHONE_PENDING" | "PHONE_VERIFIED" | "COMPLETED" | "EXPIRED" | "FAILED";

export interface SignupRegistration {
    registrationId: string;
    name: string;
    email: string;
    phone_no: string;
    password: string;
    emailOtp: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    phoneSessionId?: string;
    status: SignupRegistrationStatus;
    createdAt: string;
}

export interface JwtTokenPayload {
    userId: string;
    sessionId: string;
    email: string;
    name: string;
}

export interface tempUser {}
