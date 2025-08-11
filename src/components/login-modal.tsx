import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const LoginModalTrigger = () => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ description: "Вход выполнен" });
        setOpen(false);
        navigate("/account", { replace: true });
      } else {
        const redirectUrl = `${window.location.origin}/account`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl },
        });
        if (error) throw error;
        toast({ description: "Проверьте почту для подтверждения аккаунта." });
        setOpen(false);
      }
    } catch (err: any) {
      toast({ description: err.message ?? (mode === "login" ? "Ошибка входа" : "Ошибка регистрации") });
    } finally {
      setLoading(false);
    }
  };

  const title = mode === "login" ? "Вход" : "Регистрация";
  const description = mode === "login" ? "Введите email и пароль, чтобы продолжить." : "Создайте аккаунт для личной страницы.";

  const switchText = mode === "login" ? (
    <span className="text-sm text-muted-foreground">Нет аккаунта?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("signup")}>Зарегистрироваться</button>
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">Уже есть аккаунт?{" "}
      <button type="button" className="text-primary underline" onClick={() => setMode("login")}>Войти</button>
    </span>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setMode("login"); }}>
      <DialogTrigger asChild>
        <button className="text-sm underline text-primary">Log in</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input id="auth-email" type="email" placeholder="email" className="placeholder:italic placeholder:text-muted-foreground" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="auth-password">Пароль</Label>
            <div className="relative">
              <Input id="auth-password" type={showPassword ? "text" : "password"} placeholder="password" className="pr-10 placeholder:italic placeholder:text-muted-foreground" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-2 inline-flex items-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            {switchText}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={loading}>{loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModalTrigger;
