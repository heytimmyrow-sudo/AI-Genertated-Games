(function () {
  const StillwakeHouse = window.StillwakeHouse || (window.StillwakeHouse = {});

  class UIController {
    constructor() {
      this.title = document.getElementById("stillwakeTitle");
      this.startButton = document.getElementById("stillwakeStart");
      this.fade = document.getElementById("stillwakeFade");
      this.prompt = document.getElementById("stillwakePrompt");
      this.note = document.getElementById("stillwakeNote");
      this.noteLabel = document.getElementById("stillwakeNoteLabel");
      this.noteTitle = document.getElementById("stillwakeNoteTitle");
      this.noteBody = document.getElementById("stillwakeNoteBody");
      this.closeNote = document.getElementById("stillwakeCloseNote");
      this.hint = document.getElementById("stillwakeHint");
    }

    showPrompt(show, text) {
      this.prompt.hidden = !show;
      if (text) {
        this.prompt.innerHTML = text;
      }
    }

    openLetter(noteData) {
      if (noteData) {
        this.noteLabel.textContent = noteData.label || "Note";
        this.noteTitle.textContent = noteData.title || "";
        this.noteBody.innerHTML = "";
        for (const line of noteData.lines || []) {
          const p = document.createElement("p");
          if (line.scratched) {
            const span = document.createElement("span");
            span.className = "scratched";
            span.textContent = line.text;
            p.appendChild(span);
          } else {
            p.textContent = line.text;
          }
          this.noteBody.appendChild(p);
        }
      }
      this.note.hidden = false;
    }

    closeLetter() {
      this.note.hidden = true;
    }

    fadeToBlack() {
      this.fade.hidden = false;
      this.fade.classList.remove("is-clear");
    }

    fadeFromBlack() {
      this.fade.hidden = false;
      window.requestAnimationFrame(() => {
        this.fade.classList.add("is-clear");
      });
      window.setTimeout(() => {
        if (this.fade.classList.contains("is-clear")) {
          this.fade.hidden = true;
        }
      }, 1200);
    }

    beginFade() {
      this.fadeToBlack();
      this.fadeFromBlack();
    }
  }

  StillwakeHouse.UIController = UIController;
}());
