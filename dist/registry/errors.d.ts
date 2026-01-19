export declare enum RegistryErrorCode {
    INIT_FAILED = "INIT_FAILED",
    INVALID_MANIFEST = "INVALID_MANIFEST",
    CHECKSUM_MISMATCH = "CHECKSUM_MISMATCH",
    NOT_FOUND = "NOT_FOUND",
    INVALID_STATE = "INVALID_STATE",
    CAPABILITY_DENIED = "CAPABILITY_DENIED",
    DEPENDENCY_CYCLE = "DEPENDENCY_CYCLE",
    VERSION_CONFLICT = "VERSION_CONFLICT"
}
export declare class RegistryError extends Error {
    readonly code: RegistryErrorCode;
    readonly details?: any;
    constructor(code: RegistryErrorCode, message: string, details?: any);
    toJSON(): {
        name: string;
        code: RegistryErrorCode;
        message: string;
        details: any;
    };
}
