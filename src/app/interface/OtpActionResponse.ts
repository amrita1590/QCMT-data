export interface OtpActionResponse {
    status: string;
    message: string;
    sessionId: string;
    deliveryType: string;
    maskedEmail: string | null;
    maskedMobile: string | null;
    resendIntervalSeconds: number;
}
