export const GEMINI_ERROR_MESSAGES: { [key: number]: string } = {
    400: "I couldn't process that request. Please ensure your message or image is valid.",
    401: 'Authentication failed. Please check your configuration.',
    403: "I'm experiencing an internal configuration issue. (API Access Denied).",
    404: 'My AI models are currently offline or undergoing maintenance. Please try again later.',
    429: "I'm getting a little too much traffic right now! Please wait a minute and try again.",
    500: 'My servers are currently experiencing high demand. Please try again shortly.',
    503: 'My servers are currently experiencing high demand. Please try again shortly.',
};

export enum VALIDATION_ERRORS {
    MISSING_IMAGE = "No image was provided. Please attach an image to proceed.",
};

export enum FALLBACK_ERRORS {
    NETWORK = "I'm experiencing network connectivity issues. Please check your connection and try again.",
    API_UNKNOWN = 'An unexpected AI error occurred. Please try again.',
    GENERAL = "I'm having trouble connecting right now. Please try again in a moment.",
};
