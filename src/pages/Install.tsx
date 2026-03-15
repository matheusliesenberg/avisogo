import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            {isInstalled ? (
              <CheckCircle2 className="w-8 h-8 text-primary" />
            ) : (
              <Smartphone className="w-8 h-8 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isInstalled ? "App Instalado!" : "Instalar Painel Digital"}
          </CardTitle>
          <CardDescription>
            {isInstalled
              ? "O aplicativo já está instalado no seu dispositivo"
              : "Instale nosso app para acesso rápido e offline"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isInstalled && (
            <>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Acesso rápido do seu celular</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Funciona offline</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Notificações em tempo real</span>
                </div>
              </div>

              {isInstallable ? (
                <Button onClick={handleInstall} className="w-full" size="lg">
                  <Download className="mr-2 h-4 w-4" />
                  Instalar Agora
                </Button>
              ) : (
                <div className="text-sm text-center text-muted-foreground bg-muted p-4 rounded-lg">
                  <p className="font-medium mb-2">Como instalar:</p>
                  <p className="text-xs">
                    <strong>iPhone:</strong> Toque em <strong>Compartilhar</strong> → <strong>Adicionar à Tela de Início</strong>
                  </p>
                  <p className="text-xs mt-2">
                    <strong>Android:</strong> Abra o menu do navegador → <strong>Adicionar à tela inicial</strong>
                  </p>
                </div>
              )}
            </>
          )}

          <Button
            variant={isInstalled ? "default" : "outline"}
            className="w-full"
            onClick={() => navigate("/")}
          >
            {isInstalled ? "Abrir Aplicativo" : "Continuar no Navegador"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
