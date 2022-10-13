import * as THREE from "three";
import { TWEEN } from "https://unpkg.com/three@0.139.0/examples/jsm/libs/tween.module.min.js";
import { OrbitControls } from "OrbitControls";
import { Gradient } from "jsGradient";
import {
  range,
  remapValue,
  fetchText,
  fetchJSON,
  fetchRGB,
  geomPTCloud,
  makeBaseGrid,
} from "utils";
import { drawPies } from "ch_utils";
// import { drawChart } from "dy_utils";;

import { Clock, NoToneMapping } from "three";

let scene, renderer, camera, controls, ambientlight;
let bars, boxes, aspect;
var time_range, filter_grid, filter_prod;
var chart = document.querySelector("#chart");
const dummy = new THREE.Object3D(); // Dummmy geom for instance mesh
const dammy = new THREE.Object3D(); // Dummmy geom for instance mesh
const keys = ["gender", "age", "group"]; // Data layers
const subdiv = [2, 4, 6]; // Grid subdivision factor per data layer

const ptCloudPath = "./models/csv/ptcloud_01.csv";
const gridPath = "./models/csv/grid.csv";
const gridValsPath = "./models/json/grid_values_10.json";
const resPath = "./models/csv/grid_res_01.csv";
const colorsPath = "./styles/colors_viz.json";
const prodPath = "./models/csv/products.csv";
const prodValsPath = "./models/json/prod_values_10.json";

const pt_arr = await fetchText(ptCloudPath); // PointCloud
const grid_arr = await fetchText(gridPath); // Array with locations of grid points
const grid_res = await fetchText(resPath);
const prod_arr = await fetchText(prodPath);

var grid_vals = await fetchJSON(gridValsPath); // Array with the detections
grid_vals = grid_vals.data;
const colors = await fetchJSON(colorsPath); // Color gradients
fetchRGB(colors);
var prod_vals = await fetchJSON(prodValsPath); // Array with the detections
prod_vals = prod_vals.data;

let sldHeight = document.getElementById("sldCon_Height");
let sldWidth = document.getElementById("sldCon_Width");
let sldClip = document.getElementById("sldRan_Clip");
let sldSkew = document.getElementById("sldCon_Skew");
let sldFoc = document.getElementById("sldCon_Foc");

let tglGridProd = document.getElementById("tgl_focus");

const amount_g = grid_arr.length * 6 + 1; // Max bars instances as the max grid cells
const amount_p = prod_arr.length;
var ptCloud = await geomPTCloud(pt_arr, new THREE.Color("rgb(100,100,100))"));

let camera_positions = [
  [-100, 100, -100],
  [0, 100, -0.0000001],
];

function init() {
  const canvas = document.getElementById("canvas");
  document.body.appendChild(canvas);

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  aspect = width / height;

  // Base settings
  renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true });
  renderer.setSize(width, height);
  canvas.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color("rgb(20,20,20))");

  tglCamera(); // Set initial position camera
  // Apply camera displacement to fit UI
  scene.translateX(-10.5).translateZ(-5);

  // Import Pointcloud
  scene.add(ptCloud);

  // Initiate mesh bar instances
  let w = 0.05;
  let d = 0.05;
  let h = 1;

  let geometry = new THREE.BoxGeometry(w, h, d);
  let material = new THREE.MeshBasicMaterial({
    opacity: 1,
    transparent: true,
  });

  bars = new THREE.InstancedMesh(geometry, material, amount_g);
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
  bars.name = "bars";
  scene.add(bars);

  // Initiate mesh box instances
  w = 0.05;
  d = 0.05;
  h = 0.05;

  geometry = new THREE.BoxGeometry(w, h, d);
  material = new THREE.MeshBasicMaterial({
    opacity: 1,
    transparent: true,
  });

  boxes = new THREE.InstancedMesh(geometry, material, amount_p);
  boxes.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
  boxes.name = "boxes";
  scene.add(boxes);

  // Reset time range threshold values
  time_range = [0, grid_vals.length];

  // Arrow for entrance
  let p = [28, 1, 4.172431];
  let l = 0.25;
  const points = [];
  points.push(new THREE.Vector3(...p));
  points.push(new THREE.Vector3(p[0] + l, p[1], p[2] - l));
  points.push(new THREE.Vector3(p[0] + l, p[1], p[2] + l));
  points.push(new THREE.Vector3(...p));

  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const line = new THREE.Line(geo);
  scene.add(line);
}

function updateGrid() {
  filter_grid = document.querySelector(".db_filter.active").id;

  let detections = grid_vals;

  // Inputs ---------------------------------------------
  let fac_H = sldHeight.noUiSlider.get(); // Z exaggerating factor
  let fac_W = sldWidth.noUiSlider.get(); // Width exaggerating factor
  let filt_clip = sldClip.noUiSlider.get(); // Clip Min Max
  let fac_Sk = sldSkew.noUiSlider.get(); // Skewing factor
  let key_foc = $("#drop_Foc").dropdown("get value"); // Filter focus key
  let filt_foc = sldFoc.noUiSlider.get(); // Filter focus distance
  let toggle = tglGridProd.firstElementChild.classList.contains("user");

  let labels = [
    ["layers_lbl_0_0", "layers_lbl_0_1"],
    ["layers_lbl_1_0", "layers_lbl_1_1", "layers_lbl_1_2", "layers_lbl_1_3"],
    [
      "layers_lbl_2_0",
      "layers_lbl_2_1",
      "layers_lbl_2_2",
      "layers_lbl_2_3",
      "layers_lbl_2_4",
      "layers_lbl_2_5",
    ],
  ];

  const v = 0.1 / 2;
  const vec_X = [
    [v, -v],
    [v, v, -v, -v],
    [v, v, v, -v, -v, -v],
  ];
  const vec_Z = [
    [0, 0],
    [v, -v, v, -v],
    [v, -v, 0, 0, v, -v],
  ];

  let j = 1;

  detections = detections.slice(time_range[0], time_range[1]);
  // Selected key
  let f = keys.indexOf(filter_grid);
  let key = filter_grid;
  let colors_sel = colors[key]; // Prepare Color gradients

  // Loop for values of filters
  // active
  for (let i = 0; i < subdiv[f]; i++) {
    let vals_filt = [];
    // Prepare filtered values
    for (const detection of detections) {
      if (detection[key] == i) {
        vals_filt.push(detection.id);
      }
    }

    // Update labels
    let lbl_id = labels[f][i];
    let lbl = document.getElementById(lbl_id);
    let perc = Math.round((vals_filt.length * 100) / detections.length);
    lbl.textContent = perc + "%";

    // Count occurencies per id
    let counts = [...Array(grid_arr.length)].map((x) => 0);
    for (const num of vals_filt) {
      counts[num] = counts[num] + 1;
    }
    let cMax = Math.max(...Object.values(counts)); // Extract max occurencies for color gradient

    // Cap values to avoid [TEMPORARY FIX]
    let capMax = 20;
    if (cMax > capMax) {
      cMax = capMax;
    }

    let cMin = Math.min(...Object.values(counts)); // Extract min occ for remap
    let baseRange = [cMin, cMax];
    let skewRange = [Math.pow(cMin, fac_Sk), Math.pow(cMax, fac_Sk)];

    const gradient = new Gradient()
      .setColorGradient("#000000", colors_sel[i])
      .setMidpoint(cMax * filt_clip[1]); // Extract Mid point based on cMax and the SldClip

    for (let id = 0; id < grid_arr.length; id++) {
      if (counts[id]) {
        if (
          filt_clip[0] * cMax <= counts[id] &&
          counts[id] <= filt_clip[1] * cMax
        ) {
          if (
            grid_arr[id][key_foc] <= parseFloat(filt_foc) ||
            typeof grid_arr[id][key_foc] == "undefined"
          ) {
            // Positions
            const x = parseFloat(grid_arr[id].X);
            const y = parseFloat(grid_arr[id].Y);
            const z = parseFloat(grid_arr[id].Z);
            dummy.position.set(x, 0, z);

            let scaleY, scaleXZ, color;
            if (toggle == true) {
              scaleY =
                remapValue(Math.pow(counts[id], fac_Sk), skewRange, baseRange) *
                fac_H;
              scaleXZ = (counts[id] / cMax) * fac_W + 1;
              color = gradient.getColor(counts[id]); // Extract color gradient
            } else {
              scaleY = 0.05;
              scaleXZ = 1;
              color = "#7f7f7f";
            }

            dummy
              .translateY(scaleY / 2)
              .translateX(vec_X[f][i])
              .translateZ(vec_Z[f][i]);

            dummy.scale.set(scaleXZ, scaleY, scaleXZ);
            dummy.updateMatrix();

            // Apply deformation on bar
            j++;
            bars.setMatrixAt(j, dummy.matrix);
            bars.setColorAt(j, new THREE.Color(color));
          }
        }
      }
    }
  }

  // Remove bars that are not included in the db
  while (j < amount_g) {
    j++;
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    bars.setMatrixAt(j, dummy.matrix);
    bars.setColorAt(j, new THREE.Color("#000000"));
  }

  // Enable update properties in loop
  bars.instanceMatrix.needsUpdate = true;
  bars.instanceColor.needsUpdate = true;
}

function updateProd() {
  filter_prod = document.querySelector(".db_p_filter.active").id;

  let detections = prod_vals;

  // Inputs ---------------------------------------------
  let fac_W = sldWidth.noUiSlider.get(); // Width exaggerating factor
  let filt_clip = sldClip.noUiSlider.get(); // Clip Min Max
  let fac_Sk = sldSkew.noUiSlider.get(); // Skewing factor
  let key_foc = $("#drop_Foc").dropdown("get value"); // Filter focus key
  let filt_foc = sldFoc.noUiSlider.get(); // Filter focus distance
  let toggle = tglGridProd.firstElementChild.classList.contains("shopping");

  const v = 0.1 / 2;

  let j = 1;

  detections = detections.slice(time_range[0], time_range[1]);
  // Selected key
  // let f = keys.indexOf(filter_prod);
  let key = filter_prod;
  // let colors_sel = colors[key]; // Prepare Color gradients

  let vals_filt = [];
  // Loop for values of filters
  for (const detection of detections) {
    let ids = detection[key];
    for (let l = 0; l < ids.length; l++) {
      vals_filt.push(ids[l]);
    }
  }

  // Count occurencies per id
  let counts = [...Array(prod_arr.length)].map((x) => 0);
  for (const num of vals_filt) {
    counts[num] = counts[num] + 1;
  }

  let cMax = Math.max(...Object.values(counts)); // Extract max occurencies for color gradient
  let cMin = Math.min(...Object.values(counts)); // Extract min occ for remap

  let baseRange = [cMin, cMax];

  for (let id = 0; id < prod_arr.length; id++) {
    // Harmonize to local min/max
    counts[id] = parseInt(remapValue(counts[id], baseRange, [1, 10]));
  }
  cMax = 10;

  baseRange = [0, 10];
  let skewRange = [Math.pow(cMin, fac_Sk), Math.pow(cMax, fac_Sk)];

  const gradient = new Gradient().setColorGradient("#000000", "#39FF14");
  // .setMidpoint(10); // Extract Mid point based on cMax and the SldClip

  for (let id = 0; id < prod_arr.length; id++) {
    if (counts[id]) {
      if (
        filt_clip[0] * cMax <= counts[id] &&
        counts[id] <= filt_clip[1] * cMax
      ) {
        if (
          prod_arr[id][key_foc] <= parseFloat(filt_foc) ||
          typeof prod_arr[id][key_foc] == "undefined"
        ) {
          // Positions
          const x = parseFloat(prod_arr[id].X);
          const y = parseFloat(prod_arr[id].Y);
          const z = parseFloat(prod_arr[id].Z);
          dammy.position.set(x, y, z);

          let scale, color;

          if (toggle == true) {
            scale = counts[id] * fac_W;
            color = String(gradient.getColor(counts[id])); // Extract color gradient
          } else {
            scale = 1;
            color = "#7f7f7f";
          }

          // dammy.translateY(scale / 2);

          dammy.scale.set(scale, scale, scale);
          dammy.updateMatrix();

          // Apply deformation on bar
          j++;
          boxes.setMatrixAt(j, dammy.matrix);
          boxes.setColorAt(j, new THREE.Color(color));
        }
      }
    }
  }

  // Remove boxes that are not included in the db
  while (j < amount_p) {
    j++;
    dammy.scale.set(0, 0, 0);
    dammy.updateMatrix();
    boxes.setMatrixAt(j, dammy.matrix);
    boxes.setColorAt(j, new THREE.Color("#000000"));
  }

  // Enable update properties in loop
  boxes.instanceMatrix.needsUpdate = true;
  boxes.instanceColor.needsUpdate = true;
}

function render() {
  let bool = tglGridProd.firstElementChild.classList.contains("user");
  updateGrid();

  updateProd();

  // if (bool == true) {
  //   var selectedObject = scene.getObjectByName("boxes");
  //   selectedObject.visible = false;
  //   var selectedObject = scene.getObjectByName("bars");
  //   selectedObject.visible = true;
  // } else {
  //   var selectedObject = scene.getObjectByName("bars");
  //   selectedObject.visible = false;
  //   var selectedObject = scene.getObjectByName("boxes");
  //   selectedObject.visible = true;
  // }

  controls.update();
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

let cam_i = 0; // Iterative for toggle click
function tglCamera() {
  const D = [7, 6];
  let i = cam_i % 2;

  let d = D[i];
  camera = new THREE.OrthographicCamera(
    -d * aspect,
    d * aspect,
    d,
    -d,
    1,
    2000
  );
  camera.position.set(...camera_positions[i]);

  // Set the center of pivot for the orbit at volume centroid
  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0, 0);

  // controls.enableDamping = true; // Set inertia on camera
  if (i == 1) {
    controls.enableRotate = false; // Remove rotation on planar view
    scene.translateZ(-2);
  } else {
    scene.translateZ(+2);
  }

  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };

  controls.update();
  cam_i++;
}
document.querySelector("#tgl_camera").addEventListener("click", tglCamera);
document
  .querySelectorAll(".db_filter")
  .forEach((input) => input.addEventListener("click", drawChart));

// ---------------------------- Insights charts

await drawPies(grid_vals, keys, colors, subdiv);

let d = $("#drop_Filt").dropdown({
  // action: "combo",
  clearable: true,
  onChange: function (value, text, $selectedItem) {
    drawPies(grid_vals, keys, colors, subdiv);
  },
});

// ---------------------------- Dygraph charts

function roundToTimeUnit(unix, step) {
  const ms = 1000 * step;
  return Math.round(((unix * 1000) / ms) * ms);
}

var dy_options = {
  title: "",
  legend: "never",
  ylabel: "Flow",
  height: 200,
  strokeWidth: 3,
  fillAlpha: 0.2,
  fillGraph: true,
  rollPeriod: 2,
  stepPlot: true,
  showLabelsOnHighlight: false,
  rangeSelectorAlpha: 0.1,
  showRangeSelector: true,
  rangeSelectorBackgroundStrokeColor: "rgb(128, 128, 128)",
  rangeSelectorPlotFillColor: "black",
  rangeSelectorPlotFillGradientColor: "rgb(128, 128, 128)",
  axisLineColor: "rgb(128, 128, 128)",
  animatedZooms: false,
  drawCallback: function () {
    // this.ready(function () {
    let chart_range = this.xAxisRange().concat(); // Get boundaries of range selector
    let id_arr = []; // Array of indexes of grid_vals to then slice in render()
    let timeStamps = [];

    // Check if indexes are within range selector
    for (let id = 0; id < grid_vals.length; id++) {
      let dt = grid_vals[id].timestamp;
      timeStamps.push(dt);
      // let dt = (timeStamp - (timeStamp % 60)) * 1000;
      if (chart_range[0] / 1000 <= dt && dt <= chart_range[1] / 1000) {
        id_arr.push(dt);
      }
    }

    if (id_arr.length < 2) {
      time_range = [0, 0];
    } else {
      time_range = [
        timeStamps.indexOf(id_arr[0]),
        timeStamps.indexOf(id_arr.slice(-1)[0]),
      ]; // Store values in time_range
    }
  },
};

async function drawChart() {
  let detections = grid_vals;
  // Update Chart on UI selector
  setTimeout(async function () {
    let filter_grid = document.querySelector(".db_filter.active").id;
    // Selected key
    let f = keys.indexOf(filter_grid);
    let key = filter_grid;
    let colors_sel = colors[key]; // Prepare Color gradients

    let time_step = 30;
    let timeStamp = []; // Prepare db with indexes to store values
    for (const detection of detections) {
      let time = detection.timestamp;
      let time_round = roundToTimeUnit(time, time_step);
      timeStamp.push(time_round);
    }

    let timeStamp_unique = Array.from(new Set(timeStamp));
    let ch_lim = timeStamp_unique.length; // Upper X limit of chart (timestamp of last detection
    let db = []; // Prepare db for chart with timestamp column
    for (let i = 0; i < ch_lim; i++) {
      db.push([new Date(timeStamp_unique[i])]);
    }

    // Loop for values of filters
    for (let i = 0; i < subdiv[f]; i++) {
      let vals_filt = [];
      let timeStamp_filt = [];

      // Prepare filtered values
      for (const detection of detections) {
        if (detection[key] == i) {
          vals_filt.push(detection.id);
          let time = detection.timestamp;
          let time_round = roundToTimeUnit(time, time_step);
          timeStamp_filt.push(time_round);
        }
      }

      // Calculate counts per timestamp
      let offset = 0.05 * i;
      let ch_counts = [...Array(ch_lim)].map((x) => offset);
      for (const num of timeStamp_filt) {
        let id = timeStamp_unique.indexOf(num);
        ch_counts[id] = ch_counts[id] + 1; // Count occurrencies per timestamp
      }

      for (let i = 0; i < ch_lim; i++) {
        let item = db[i];
        db[i] = item.concat(ch_counts[i]);
      }

      if (i == 0) {
        try {
          chart.destroy();
        } catch (e) {}
      }
    }

    await new Dygraph(chart, db, dy_options).updateOptions({
      colors: colors_sel,
      labels: ["Date", "d1", "d2", "d3", "d4", "d5", "d6"],
    });
  }, 0);
}

// ---------------------------------------------------------------------------------------------- INIT
init();
makeBaseGrid(scene, grid_res);
drawChart();
drawPies(grid_vals, keys, colors, subdiv);
animate();
