import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email address is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' }),
});

export const signupSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: 'Full name must be at least 2 characters' })
      .max(50, { message: 'Name is too long' }),
    email: z
      .string()
      .min(1, { message: 'Email address is required' })
      .email({ message: 'Please enter a valid email address' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
    targetExam: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;


// import { z } from "zod";

// export const loginSchema = z.object({
//   email: z.string().email("Enter a valid email"),
//   password: z.string().min(1, "Password is required"),
// });

// export const signupSchema = z
//   .object({
//     name: z.string().min(2, "Name must be at least 2 characters"),
//     email: z.string().email("Enter a valid email"),
//     password: z.string().min(8, "Password must be at least 8 characters"),
//     confirmPassword: z.string().min(1, "Confirm your password"),
//     targetExam: z.string().optional(),
//   })
//   .refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords do not match",
//     path: ["confirmPassword"],
//   });