import { AxiosError } from "axios";

export interface FriendlyError {
  status: number;
  message: string;
  originalError: AxiosError;
}

export function handleApiError(error: AxiosError): FriendlyError {
  const status = error.response?.status || 500;
  let message = "An unexpected error occurred. Please try again.";

  // Safe extraction of backend custom messages while avoiding password/sensitive logs leaks
  const backendData = error.response?.data as any;
  const backendMessage = backendData?.message || backendData?.error;

  switch (status) {
    case 400:
      message = backendMessage || "Invalid request. Please check your inputs and try again.";
      break;
    case 401:
      message = "Session expired or unauthorized. Please sign in to continue.";
      break;
    case 403:
      message = backendMessage || "Access denied. You do not have permission to view or execute this resource.";
      break;
    case 404:
      message = "The requested resource could not be found on the server.";
      break;
    case 409:
      message = backendMessage || "Conflict detected. The requested action conflicts with existing state.";
      break;
    case 422:
      message = backendMessage || "Validation failed. Please verify that all input fields are correctly populated.";
      break;
    case 429:
      message = "Too many requests. Please pause briefly before retrying.";
      break;
    case 500:
      message = "A critical database or internal server error occurred. Please contact system support.";
      break;
    case 503:
      message = "The authentication service is temporarily offline for maintenance. Please retry shortly.";
      break;
    default:
      if (error.message === "Network Error") {
        message = "Network error. Please check your internet connection and gateway settings.";
      } else if (backendMessage) {
        message = backendMessage;
      }
      break;
  }

  return {
    status,
    message,
    originalError: error,
  };
}
