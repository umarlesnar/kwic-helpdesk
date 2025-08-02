//app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Formik, Form, Field, ErrorMessage, FormikHelpers } from "formik";
import * as Yup from "yup";
import { useAuth } from "@/components/shared/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Loading } from "@/components/ui/Icon/loading";

import { toast, Toaster } from "sonner";

interface LoginFormValues {
  email: string;
  password: string;
  general?: string;
}

const validationSchema = Yup.object({
  email: Yup.string().email("Invalid email").required("*Email is required"),
  password: Yup.string()
    .min(4, "Password must be at least 4 characters")
    .required("*Password is required"),
});

const toastStyles = {
  success: {
    style: {
      border: "1px solid #4ac959",
      padding: "10px",
      color: "#ffffff",
      background: "#4ac959",
    },
    iconTheme: {
      primary: "#4ac959",
      secondary: "#f0f7f0",
    },
  },
  error: {
    style: {
      border: "1px solid #fef2f2",
      padding: "16px",
      color: "#",
      background: "#fef2f2",
    },
  },
};

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);


  useEffect(() => {
    if (user) {
      toast.success("Login successful! ", {
        ...toastStyles.success,
        position: "top-right",
        duration: 1000,
      });

      const redirectTimer = setTimeout(() => {
        switch (user.role) {
          case "customer":
            router.push("/customer");
            break;
          case "agent":
            router.push("/support");
            break;
          case "admin":
            router.push("/admin");
            break;
          default:
            router.push("/");
        }
      }, 2000);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, router]);

  if (user) return null;

  const initialValues: LoginFormValues = { email: "", password: "" };

  const handleSubmit = async (
    values: LoginFormValues,
    { setSubmitting, setFieldError }: FormikHelpers<LoginFormValues>
  ) => {
    try {
      const success = await login(values.email, values.password);
      if (!success) {
        // setFieldError("general", "Invalid email or password");
        toast.error("Invalid email or password", {
          ...toastStyles.error,
          position: "top-right",
        });
      }
    } catch (error) {
      setFieldError("general", "An error occurred during login");
      toast.error("An error occurred during login", {
        ...toastStyles.error,
        position: "top-right",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f7f0] to-[#e0efe0] flex items-center justify-center px-4 py-12">
      <Toaster
        position="top-center"
        toastOptions={{
          // success: toastStyles.success,
          // error: toastStyles.error,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="bg-[#4ac959] h-2 w-full"></div>

        <div className="p-8">
          <motion.div whileHover={{}} className="flex justify-center mb-8">
            <Image
              src="/kwic.jpg"
              alt="Logo"
              width={130}
              height={130}
              className="rounded-full "
              priority
            />
          </motion.div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to the Help Center
            </h1>
            <p className="text-gray-600">Please sign in to continue</p>
          </div>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors }) => (
              <Form className="space-y-6">
                {errors.general && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert
                      variant="destructive"
                      className="bg-red-50 border border-red-200 text-red-600"
                    >
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <Field
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    as={Input}
                    className="bg-white border border-gray-200 focus:border-[#4ac959] focus:ring-1 focus:ring-[#4ac959] text-gray-900 placeholder-gray-400 h-11 w-full rounded-lg transition-all duration-200"
                  />
                  <ErrorMessage
                    name="email"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-gray-700 font-medium "
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Field
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      as={Input}
                      className="bg-white border border-gray-200 focus:border-[#4ac959] focus:ring-1 focus:ring-[#4ac959] text-gray-900 placeholder-gray-400 h-11 w-full rounded-lg pr-10 transition-all duration-200"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="div"
                    className="text-red-500 text-xs mt-1"
                  />
                </div>

                <div className="flex justify-end"></div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex justify-center">
                    <Button
                      type="submit"
                      className="text-center justify-center items-center flex bg-[#4ac959] hover:bg-[#3dbf4c] text-white w-[250px] py-3 rounded-lg text-md font-semibold shadow-md transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <Loading />
                          Signing in...
                        </span>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </div>
                </motion.div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </div>
  );
}
