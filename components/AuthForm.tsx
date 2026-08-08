"use client"

import React from 'react';
import { z } from "zod"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form";
import FormField from "@/components/FormField";
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from "@/firebase/client";
import { signIn, signUp } from '@/lib/actions/auth.action';


const authFormSchema = (type: FormType) => {
    return z.object({
        name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
        email: z.string().email(),
        password: z.string().min(6, "Password must be at least 6 characters"),
    })
};

const AuthForm = ({ type }: { type: FormType }) => {
    const router = useRouter();
    const formSchema = authFormSchema(type);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        const { name, email, password } = values;
        try {
            if (type === "sign-up") {
                const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
               
                const result = await signUp({
                    uid: userCredentials.user.uid,
                    name: name!,
                    email,
                    password
                });

                if (!result?.success) {
                    toast.error(`${result?.message}`);
                    return;
                }

                toast.success("Account created successfully. Please Sign in");
                router.push("/sign-in");

            } else {
                const { email, password } = values;
                const userCredentials = await signInWithEmailAndPassword(auth, email, password);
                const idToken = await userCredentials.user.getIdToken();

                if (!idToken) {
                    toast.error("Sign in failed");
                    return;
                }

                const result = await signIn({ email, idToken });
                
                if (result?.success) {
                    toast.success("Sign in successfully");
                    router.push("/");
                }               
            }
        } catch (error) {
            console.log("Auth error: ", error);

            let message = "Something went wrong. Please try again.";

            if (error instanceof Error) {
                if (error.message.includes("auth/invalid-credential")) {
                    message = "Invalid email or password.";
                } else if (error.message.includes("auth/user-not-found")) {
                    message = "User not found. Please sign up.";
                } else if (error.message.includes("auth/wrong-password")) {
                    message = "Incorrect password. Try again.";
                } else {
                    message = error.message;
                }
            }

            toast.error(`The error occured: ${message}`);
        }
    };

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: ""
        },
    });

    const isSignIn = type === "sign-in";
    return (
        <div className="card-border lg:min-w-[566px]">
            <div className="flex flex-col gap-6 card py-14 px-10">
                <div className="flex flex-row gap-2 justify-center">
                    <Image src="/logo.svg" alt="logo" height={32} width={38} />
                    <h2 className="text-primary-100">PrepWise</h2>
                </div>

                <h3 className="flex justify-center">Practice job interview with AI</h3>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}
                          className="space-y-6 w-full mt-4 form">
                        {!isSignIn && 
                          <FormField name="name"
                                     label="Name"
                                     control={form.control}
                                     placeholder="Your Name"
                          />
                        }
                        <FormField name="email"
                                   label="Email"
                                   control={form.control}
                                   type="email"
                                   placeholder="Email"
                        />
                        <FormField name="password"
                                   type="password"
                                   label="Password"
                                   control={form.control}
                                   placeholder="Password"
                        />
                        <Button type="submit"
                                className="btn">
                            {isSignIn ? "Sign In" : "Create an Account"}
                        </Button>
                    </form>
                </Form>

                <p className="text-center">
                    {isSignIn ? "Don't have an account? " : "Already have an account?"}
                    <Link href={isSignIn ? "/sign-up" : "/sign-in"}
                         className="font-bold text-orange-200 ml-4">
                        {isSignIn ? "Create an Account" : "Sign In"}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default AuthForm;
