import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center bg-[#F8F9FA] px-6 py-20 animate-in fade-in duration-1000">
      <div className="w-full max-w-sm flex flex-col items-center">
         <div className="mb-12 text-center">
            <div className="h-10 w-10 bg-[#0F1059] rounded-md flex items-center justify-center text-white font-normal text-sm mx-auto mb-6 transition-transform active:scale-95 group">IT</div>
            <h1 className="text-base font-normal text-[#0F1059] uppercase tracking-wide leading-none mb-4">Service <br /> Hub</h1>
            <p className="text-sm font-normal uppercase tracking-wide text-[#ADB5BD] mt-2 opacity-80">Enterprise Logic // 2024</p>
         </div>
         
         <div className="w-full bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-[#0F1059]/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
            <LoginForm />
         </div>

         <div className="mt-14 text-center">
            <p className="text-sm font-normal text-[#ADB5BD] uppercase tracking-wide leading-loose opacity-60">
               Authorized corporate use only. <br /> SEC-PROTOCOL ENGAGED.
            </p>
         </div>
      </div>

      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-60">
         <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #E9ECEF 1.5px, transparent 0)', backgroundSize: '48px 48px' }} />
      </div>
    </main>
  );
}
