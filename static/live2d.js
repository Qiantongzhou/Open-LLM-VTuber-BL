var app, model2;
var modelInfo, emoMap;
var pointerInteractionEnabled = true;

const live2dModule = (function () {
  const live2d = PIXI.live2d;

  async function init() {
    app = new PIXI.Application({
      view: document.getElementById("canvas"),
      autoStart: true,
      resizeTo: window,
      transparent: true,
      backgroundAlpha: 0,
    });
  }

  async function loadModel(modelInfo) {
    emoMap = modelInfo["emotionMap"];

    if (model2) {
      app.stage.removeChild(model2); // Remove old model
    }

    const models = await Promise.all([
      live2d.Live2DModel.from(modelInfo.url, {
        autoInteract: window.pointerInteractionEnabled
      }),
    ]);

    models.forEach((model) => {
      app.stage.addChild(model);

      const scaleX = (innerWidth * modelInfo.kScale);
      const scaleY = (innerHeight * modelInfo.kScale);

      model.scale.set(Math.min(scaleX, scaleY));
      model.y = innerHeight * 0.01;
      draggable(model);
    });

    model2 = models[0];

    if (!modelInfo.initialXshift) modelInfo.initialXshift = 0;
    if (!modelInfo.initialYshift) modelInfo.initialYshift = 0;

    model2.x = app.view.width / 2 - model2.width / 2 + modelInfo["initialXshift"];
    model2.y = app.view.height / 2 - model2.height / 2 + modelInfo["initialYshift"];

    // model2.on("hit", (hitAreas) => {
    //   if (hitAreas.includes("body")) {
    //     model2.motion("tap_body");
    //   }

    //   if (hitAreas.includes("head")) {
    //     model2.expression();
    //   }
    // });
  app.ticker.add(() => {
    if (!pointerInteractionEnabled) {
      currentX += (targetX - currentX) * lerpSpeed;
      currentY += (targetY - currentY) * lerpSpeed;
      //console.log(currentX, currentY);
      model2.internalModel.focusController.targetX = currentX;
      model2.internalModel.focusController.targetY = currentY;
    }
  });


  }

  function draggable(model) {
    model.buttonMode = true;
    model.on("pointerdown", (e) => {
      model.dragging = true;
      model._pointerX = e.data.global.x - model.x;
      model._pointerY = e.data.global.y - model.y;
    });
    model.on("pointermove", (e) => {
      if (model.dragging) {
        model.position.x = e.data.global.x - model._pointerX;
        model.position.y = e.data.global.y - model._pointerY;
      }
    });
    model.on("pointerupoutside", () => (model.dragging = false));
    model.on("pointerup", () => (model.dragging = false));
  }

  function changeBackgroundImage(imageUrl) {
    document.body.style.backgroundImage = `url('${imageUrl}')`;
  }

  return {
    init,
    loadModel,
    changeBackgroundImage
  };
})();

let idleInterval;
let currentX = 0;
let currentY = 0;
let targetX = 0;
let targetY = 0;

// Interpolation speed (adjust to taste)
const lerpSpeed = 0.05; // Smaller = slower, smoother; larger = quicker

document.addEventListener('DOMContentLoaded', function () {
  const pointerInteractionBtn = document.getElementById('pointerInteractionBtn');



  pointerInteractionBtn.addEventListener('click', function () {
    pointerInteractionEnabled = !pointerInteractionEnabled;
    pointerInteractionBtn.textContent = pointerInteractionEnabled
      ? "👀 Pointer Interactive On"
      : "❌ Pointer Interactive Off";

    if (model2) {
      model2.interactive = pointerInteractionEnabled;
    }

    if (!pointerInteractionEnabled) {
      // When interaction turns off, start idle motion
      startIdleMotion();
    } else {
      // When interaction turns on, stop idle motion and reset
      stopIdleMotion();
      resetFocus();
    }
  });
});



function startIdleMotion() {
  stopIdleMotion(); // Ensure we don't double-run the interval
  // Immediately set a first random target to kick things off
  setRandomTarget();

  idleInterval = setInterval(() => {
    setRandomTarget();
  }, 10000); // Change gaze every 2 seconds
}

function stopIdleMotion() {
  if (idleInterval) {
    clearInterval(idleInterval);
    idleInterval = null;
  }
}

function resetFocus() {
  if (model2 && model2.internalModel && model2.internalModel.focusController) {
    // Reset current and target so the model looks straight ahead
    currentX = 0;
    currentY = 0;
    targetX = 0;
    targetY = 0;

    model2.internalModel.focusController.targetX = 0;
    model2.internalModel.focusController.targetY = 0;
  }
}

function setRandomTarget() {
  // Generate small random offsets for a subtle human-like behavior
  targetX = (Math.random() * 1.6) - 0.8; // range: [-0.3, 0.3]
  targetY = (Math.random() * 0.8) -0.4; // range: [-0.3, 0.3]

}
