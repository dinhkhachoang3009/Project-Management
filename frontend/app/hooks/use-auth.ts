import { useMutation } from "@tanstack/react-query";
import type { SignupFormData } from "@/routes/auth/sign-up";
import { postData } from "@/lib/fetch-util";

export const useSignUpMutation = () => {
  return useMutation({
    mutationFn: (data: SignupFormData) => postData("/auth/register", data),
  });
};

export const useVerifyEmailMutation = () => {
  return useMutation({
    mutationFn: (data: { token: string }) =>
      postData("/auth/verify-email", data),
  });
};
