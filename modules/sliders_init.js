let sldHeight = document.getElementById("sldCon_Height");
noUiSlider.create(sldHeight, {
  start: 0.5,
  connect: "lower",
  step: 0.1,
  range: {
    min: 0,
    max: 0.5,
  },
});

let sldWidth = document.getElementById("sldCon_Width");
noUiSlider.create(sldWidth, {
  start: 1.5,
  connect: "lower",
  range: {
    min: 0,
    max: 3,
  },
});

let sldClip = document.getElementById("sldRan_Clip");
noUiSlider.create(sldClip, {
  start: [0, 1],
  connect: true,
  behaviour: "drag",
  range: {
    min: 0,
    max: 1,
  },
});

let sldSkew = document.getElementById("sldCon_Skew");
noUiSlider.create(sldSkew, {
  start: 3,
  connect: "lower",
  range: {
    min: 1,
    max: 5,
  },
});

let sldFoc = document.getElementById("sldCon_Foc");
noUiSlider.create(sldFoc, {
  start: 30,
  connect: "lower",
  range: {
    min: 0,
    max: 30,
  },
});

document.getElementById("btn_reset").addEventListener("click", resetSlider);
function resetSlider() {
  let vals = [0.5, 1.5, [0, 1], 3, 30];
  let sliders = [
    "sldCon_Height",
    "sldCon_Width",
    "sldRan_Clip",
    "sldCon_Skew",
    "sldCon_Foc",
  ];

  for (let i = 0; i < sliders.length; i++) {
    let slider = document.getElementById(sliders[i]);
    slider.noUiSlider.set(vals[i]);
  }

  $(".selection.dropdown").dropdown("restore defaults");
}
