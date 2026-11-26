import consoles from "../json/consoles.json";
import roms from "../json/roms.json";

const siteName = "Game Over Emulator";

export function installSeo(router) {
  const title = document.title;
  const description = document.head.querySelector('meta[name="description"]');
  const homeDescription = description.content;
  const socialTitle = document.head.querySelector('meta[property="og:title"]');
  const socialDescription = document.head.querySelector('meta[property="og:description"]');
  const publicOrigin = import.meta.env.VITE_SITE_URL;

  router.afterEach((route, _from, failure) => {
    if (failure) return;

    let pageTitle = title;
    let summary = homeDescription;
    let missing = false;
    let path = route.path;

    if (route.name === "Consoles") {
      pageTitle = `Catálogo de jogos por console | ${siteName}`;
      summary = "Explore o catálogo de jogos clássicos por console e escolha o que jogar grátis no navegador.";
      path = router.resolve({ name: "Consoles" }).path;
    } else if (route.name === "About") {
      pageTitle = `Sobre o ${siteName}`;
      summary = "Conheça o Game Over Emulator, projeto dedicado a preservar a história dos jogos clássicos e facilitar seu acesso pelo navegador.";
      path = router.resolve({ name: "About" }).path;
    } else if (route.name === "Games" || route.name === "Game") {
      const console = consoles.find(item => item.active && item.id === route.params.console_id);
      const game = route.name === "Game" && console && roms.find(item =>
        item.active && item.console === console.id && item.id === route.params.game_id
      );

      missing = !console || (route.name === "Game" && !game);
      if (!missing) {
        pageTitle = game
          ? `${game.name} online (${console.name}) | ${siteName}`
          : `Jogos de ${console.name} online | ${siteName}`;
        summary = game
          ? `Jogue ${game.name}, de ${console.name}, grátis no navegador com o Game Over Emulator.`
          : `Explore os jogos clássicos de ${console.name} e jogue grátis no navegador, sem instalar um emulador.`;
        path = router.resolve({ name: route.name, params: route.params }).path;
      }
    } else if (route.name === "NotFound") {
      missing = true;
    }

    if (missing) {
      pageTitle = `Página não encontrada | ${siteName}`;
      summary = "O endereço solicitado não foi encontrado. Consulte o catálogo de jogos e consoles do Game Over Emulator.";
    }

    document.title = pageTitle;
    socialTitle.content = pageTitle;
    description.content = summary;
    socialDescription.content = summary;

    document.head.querySelectorAll("[data-route-seo]").forEach(tag => tag.remove());

    if (missing) {
      const robots = document.createElement("meta");
      robots.name = "robots";
      robots.content = "noindex";
      robots.dataset.routeSeo = "";
      document.head.append(robots);
    } else if (publicOrigin) {
      const canonical = document.createElement("link");
      canonical.rel = "canonical";
      canonical.href = new URL(path, publicOrigin).href;
      canonical.dataset.routeSeo = "";
      document.head.append(canonical);
    }
  });
}
