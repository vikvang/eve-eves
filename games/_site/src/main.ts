// Populated at build time by scripts/games/build-all.ts injecting games.json
const list = document.querySelector("#games");
if (list) {
  fetch("./games.json")
    .then((r) => r.json())
    .then((games: string[]) => {
      for (const slug of games) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `./${slug}/`;
        a.textContent = slug;
        li.appendChild(a);
        list.appendChild(li);
      }
    })
    .catch(() => {
      list.textContent = "No games listed yet.";
    });
}
