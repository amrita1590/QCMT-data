export interface OtpRequiredResponse {
    status: 'OTP_REQUIRED';
    sessionId: string;
    deliveryType: string;
    maskedEmail: string | null;
    maskedMobile: string | null;
    message: string;
}
