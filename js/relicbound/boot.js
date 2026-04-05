(function () {
  const RelicboundGame = window.Relicbound?.RelicboundGame;
  const canvas = document.getElementById("gameCanvas");
  const startButton = document.getElementById("startButton");
  const restartButton = document.getElementById("restartButton");
  const fullscreenButton = document.getElementById("fullscreenButton");
  const container = document.querySelector(".relicbound-stage") || document.body;

  function showBootError(message) {
    let panel = document.getElementById("relicboundBootError");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "relicboundBootError";
      panel.style.marginTop = "12px";
      panel.style.padding = "12px 14px";
      panel.style.border = "1px solid rgba(255, 125, 114, 0.45)";
      panel.style.borderRadius = "14px";
      panel.style.background = "rgba(70, 18, 24, 0.8)";
      panel.style.color = "#ffe7e4";
      panel.style.font = "14px/1.45 Segoe UI, sans-serif";
      container.appendChild(panel);
    }
    panel.textContent = message;
  }

  window.addEventListener("error", (event) => {
    const details = event.message || "Unknown startup error.";
    showBootError("Relicbound hit an error while starting: " + details);
  });

  if (!canvas || !RelicboundGame) {
    showBootError("Relicbound scripts did not load correctly.");
    return;
  }

  try {
    const game = new RelicboundGame(canvas);
    game.start();

    if (startButton) {
      startButton.addEventListener("click", () => {
        game.startNewRun();
      });
    }

    if (restartButton) {
      restartButton.addEventListener("click", () => {
        game.restartRun();
      });
    }

    if (fullscreenButton) {
      const setFullscreenLabel = () => {
        fullscreenButton.textContent = document.fullscreenElement === container
          ? "Exit Fullscreen"
          : "Fullscreen Mode";
      };

      fullscreenButton.addEventListener("click", async () => {
        try {
          if (document.fullscreenElement === container) {
            await document.exitFullscreen();
          } else {
            await container.requestFullscreen();
          }
          setFullscreenLabel();
        } catch (error) {
          showBootError("Fullscreen is unavailable here: " + error.message);
        }
      });

      document.addEventListener("fullscreenchange", setFullscreenLabel);
      setFullscreenLabel();
    }
  } catch (error) {
    showBootError("Relicbound could not initialize: " + error.message);
  }
}());
