"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  Folder, 
  FileText, 
  Users
} from "lucide-react";

const carouselSlides = [
  {
    title: "Document Control",
    subtitle: "Organize, version, and share files in structured workspaces.",
    docTitle: "Quarterly_Financial_Report.pdf",
    docMeta: "v2.0 • Approved",
    docIcon: FileText,
  },
  {
    title: "Team Workspaces",
    subtitle: "Collaborate with team members across shared project folders.",
    docTitle: "Operations_Workspace",
    docMeta: "12 Folders • 8 Members",
    docIcon: Users,
  },
  {
    title: "Review & Approvals",
    subtitle: "Submit documents for team review and track approval status.",
    docTitle: "Client_Agreement_2026.docx",
    docMeta: "Status: Approved",
    docIcon: ShieldCheck,
  },
  {
    title: "Version History",
    subtitle: "Inspect revision logs and restore previous drafts at any time.",
    docTitle: "Compliance_Guidelines.pdf",
    docMeta: "Revision 3 of 3",
    docIcon: Folder,
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? false : true;

  const [isLogin, setIsLogin] = useState<boolean>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-advance carousel slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const currentSlide = carouselSlides[activeSlide];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Sign in via credentials provider
        const res = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (res?.error) {
          setError("Invalid email or password. Please try again.");
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        // Register new user
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            name: name.trim(),
            password,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.error || "Account creation failed. Please try again.");
        } else {
          // Automatically sign in upon registration
          const loginRes = await signIn("credentials", {
            email: email.trim(),
            password,
            redirect: false,
          });

          if (!loginRes?.error) {
            router.push("/dashboard");
            router.refresh();
          } else {
            setIsLogin(true);
            setError("");
          }
        }
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-100 via-slate-50 to-amber-50/50 font-sans antialiased text-slate-800 relative overflow-hidden select-none">
      {/* Decorative bright ambient lighting orbs */}
      <div className="w-[500px] h-[500px] bg-amber-200/40 blur-[130px] rounded-full absolute -top-32 -left-32 pointer-events-none" />
      <div className="w-[450px] h-[450px] bg-orange-200/30 blur-[120px] rounded-full absolute -bottom-24 -right-24 pointer-events-none" />
      <div className="w-[300px] h-[300px] bg-amber-100/60 blur-[90px] rounded-full absolute top-1/2 right-1/4 pointer-events-none" />

      {/* Centered Floating Card */}
      <div className="w-full max-w-[960px] rounded-[32px] overflow-hidden shadow-[0_20px_60px_-15px_rgba(30,41,59,0.14),0_0_0_1px_rgba(226,232,240,0.9)] bg-white relative flex flex-col md:flex-row transition-all duration-300 z-10">
        
        {/* ===================== SIGN IN VIEW ===================== */}
        {isLogin ? (
          <>
            {/* Left Panel: Crisp Bright White Form */}
            <div className="w-full md:w-[56%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center min-h-[480px] sm:min-h-[540px] bg-white relative z-10">
              <div className="max-w-[340px] w-full mx-auto">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sign In
                  </h1>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Enter your credentials to access your documents.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Underline E-mail input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1.5 group flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="E-mail address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-normal"
                    />
                  </div>

                  {/* Underline Password input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1.5 group flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-normal"
                    />
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-between pt-8">
                    <p className="text-xs text-slate-600">
                      No account?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setError("");
                        }}
                        className="font-bold underline text-slate-900 hover:text-amber-600 cursor-pointer transition-colors"
                      >
                        Sign up
                      </button>
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-amber-500/25 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center min-w-[100px]"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <span>Complete</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Panel: Bright Amber Accent with Left Wave Curve */}
            <div className="w-full md:w-[44%] bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-[540px] text-white">
              {/* Organic wave SVG on the left edge */}
              <svg
                viewBox="0 0 100 600"
                preserveAspectRatio="none"
                className="hidden md:block absolute -left-16 sm:-left-20 top-0 bottom-0 h-full w-16 sm:w-20 pointer-events-none z-20"
              >
                <defs>
                  <linearGradient id="waveGradLeft" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>
                <path
                  d="M 100 0 L 55 0 C 65 100, 75 180, 40 250 C 0 320, -5 380, 20 440 C 45 490, 65 540, 75 600 L 100 600 Z"
                  fill="url(#waveGradLeft)"
                />
              </svg>

              {/* Top: Brand Badge */}
              <div className="flex items-center justify-end z-10">
                <div className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center gap-2 shadow-xs">
                  <div className="w-4.5 h-4.5 rounded-full bg-white text-amber-600 flex items-center justify-center">
                    <Folder className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">DocFlow</span>
                </div>
              </div>

              {/* Middle: Headline & Floating Animated Document Card */}
              <div className="my-auto py-6 z-10">
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Welcome<br />back
                </h2>
                <p className="mt-2.5 text-xs sm:text-sm text-amber-100 font-normal leading-relaxed">
                  Sign in to access your documents and workspace.
                </p>

                {/* Animated Floating Preview Card */}
                <div className="mt-5 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg max-w-[280px] animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                      <currentSlide.docIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{currentSlide.docTitle}</p>
                      <p className="text-[10px] text-amber-100/90 mt-0.5 truncate">{currentSlide.docMeta}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Interactive Carousel Dots */}
              <div className="flex items-center justify-end gap-1.5 pt-2 z-10">
                {carouselSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeSlide === i 
                        ? 'w-6 h-2 bg-white shadow-sm' 
                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ===================== SIGN UP VIEW ===================== */
          <>
            {/* Left Panel: Bright Amber Accent with Right Wave Curve */}
            <div className="w-full md:w-[44%] bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-[540px] text-white order-2 md:order-1">
              {/* Organic wave SVG on the right edge */}
              <svg
                viewBox="0 0 100 600"
                preserveAspectRatio="none"
                className="hidden md:block absolute -right-16 sm:-right-20 top-0 bottom-0 h-full w-16 sm:w-20 pointer-events-none z-20"
              >
                <defs>
                  <linearGradient id="waveGradRight" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#d97706" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 0 L 45 0 C 35 100, 25 180, 60 250 C 100 320, 105 380, 80 440 C 55 490, 35 540, 25 600 L 0 600 Z"
                  fill="url(#waveGradRight)"
                />
              </svg>

              {/* Top: Brand Badge */}
              <div className="flex items-center justify-start z-10">
                <div className="px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center gap-2 shadow-xs">
                  <div className="w-4.5 h-4.5 rounded-full bg-white text-amber-600 flex items-center justify-center">
                    <Folder className="w-3 h-3 fill-amber-500 text-amber-500" />
                  </div>
                  <span className="text-xs font-bold tracking-tight">DocFlow</span>
                </div>
              </div>

              {/* Middle: Headline & Floating Animated Document Card */}
              <div className="my-auto py-6 z-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                  Get started with<br />DocFlow
                </h2>
                <p className="mt-2.5 text-xs text-amber-100 font-normal leading-relaxed max-w-xs">
                  Create your account to organize, share, and manage your team documents.
                </p>

                {/* Animated Floating Preview Card */}
                <div className="mt-5 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg max-w-[280px] animate-float">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                      <currentSlide.docIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{currentSlide.docTitle}</p>
                      <p className="text-[10px] text-amber-100/90 mt-0.5 truncate">{currentSlide.docMeta}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Interactive Carousel Dots */}
              <div className="flex items-center justify-start gap-1.5 pt-2 z-10">
                {carouselSlides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`transition-all duration-300 rounded-full cursor-pointer ${
                      activeSlide === i 
                        ? 'w-6 h-2 bg-white shadow-sm' 
                        : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right Panel: Crisp Bright White Form */}
            <div className="w-full md:w-[56%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center min-h-[480px] sm:min-h-[540px] bg-white relative z-10 order-1 md:order-2">
              <div className="max-w-[340px] w-full mx-auto">
                <div className="text-center mb-4">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Sign Up
                  </h1>
                </div>

                {/* Avatar Placeholder Badge */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto mb-5 shadow-xs">
                  <User className="w-6 h-6 text-amber-700" />
                </div>

                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Underline Name input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1 group flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none pb-1 font-normal"
                    />
                  </div>

                  {/* Underline E-mail input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1 group flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="email"
                      required
                      placeholder="E-mail address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none pb-1 font-normal"
                    />
                  </div>

                  {/* Underline Password input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1 group flex items-center gap-3">
                    <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none pb-1 font-normal"
                    />
                  </div>

                  {/* Underline Confirm Password input */}
                  <div className="relative border-b-2 border-slate-200 focus-within:border-amber-500 transition-colors py-1 group flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-slate-400 group-focus-within:text-amber-500 transition-colors flex-shrink-0" />
                    <input
                      type="password"
                      required
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none pb-1 font-normal"
                    />
                  </div>

                  {/* Bottom Actions Row */}
                  <div className="flex items-center justify-between pt-6">
                    <p className="text-xs text-slate-600">
                      Already signed up?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setError("");
                        }}
                        className="font-bold underline text-slate-900 hover:text-amber-600 cursor-pointer transition-colors"
                      >
                        Sign in
                      </button>
                    </p>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-xs font-semibold shadow-md shadow-amber-500/25 transition-all disabled:opacity-60 cursor-pointer flex items-center justify-center min-w-[100px]"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <span>Complete</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}