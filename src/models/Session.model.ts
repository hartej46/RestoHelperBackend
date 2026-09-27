export interface Session {
    id : string,
    users_id : string,
    ip_address : string,
    user_agent : string | null,
    device_name : string | null,
    csrf_secret : string,
    created_at : string,
    last_used_at : string,
    expires_at : string,
    updated_at : string | null,
    revoked_at : string | null,
    revoked_reason : string | null
};

export interface NewSession {
    id : string,
    users_id : string,
    ip_address : string,
    user_agent : string | null,
    device_name : string | null,
    csrf_secret : string,
    created_at : string,
    last_used_at : string,
    expires_at : string,
    updated_at : string | null,
    revoked_at : string | null,
    revoked_reason : string | null
};