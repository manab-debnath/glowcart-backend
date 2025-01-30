import { z } from "zod";

const signupSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email({ message: "Invalid email address" }),
    fullName: z
        .string()
        .min(3, { message: "name must be at least of 3 characters" }),
    password: z
        .string()
        .min(7, { message: "password must be at least of 7 characters" })
        .max(20, { message: "password can't be greater than 20 characters" }),
});

const signinSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email({ message: "Invalid email address" }),
    password: z
        .string()
        .min(7, { message: "password must be at least of 7 characters" })
        .max(20, { message: "password can't be greater than 20 characters" }),
});

export { signupSchema, signinSchema };
