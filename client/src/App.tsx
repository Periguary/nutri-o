import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Guides from "./pages/Guides";
import Recipes from "./pages/Recipes";
import Diary from "./pages/Diary";
import Videos from "./pages/Videos";
import Shopping from "./pages/Shopping";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/guias" component={Guides} />
      <Route path="/guias/rotulos" component={Guides} />
      <Route path="/guias/organizacao" component={Guides} />
      <Route path="/receitas" component={Recipes} />
      <Route path="/diario" component={Diary} />
      <Route path="/videos" component={Videos} />
      <Route path="/compras" component={Shopping} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
