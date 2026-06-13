// OTP code length — single source of truth for the login code screen.
//
// The backend generates the code as `1000 + secureRandom.nextInt(9000)` (range
// 1000–9999) → always exactly 4 digits (backend OtpService). The endpoint does
// NOT report the length (otp/request returns only retry_after_sec), so it lives
// here as a constant. If the backend ever changes the length, edit ONLY this.
//
// The code is handled as a STRING everywhere (validation, form state, the verify
// request) so a leading zero is never lost — even though the current generation
// range can't produce one, the contract is "an N-digit string", not a number.
export const OTP_CODE_LENGTH = 4;
