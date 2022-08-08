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
} from "utils";

let scene, renderer, camera, controls, ambientlight;
let bars, aspect;
var time_range, filter;
var chart = document.querySelector("#chart");
const dummy = new THREE.Object3D(); // Dummmy geom for instance mesh
const keys = ["gender", "age", "group"]; // Data layers
const subdiv = [2, 4, 6]; // Grid subdivision factor per data layer

const ptCloudPath = "models/csv/ptcloud.csv";
const gridPath = "models/csv/grid.csv";
const valsPath = "./models/json/grid_values.json";
const meshPath = "./models/json/grid_mesh.json";
const resPath = "./models/csv/grid_res.csv";
const colorsPath = "./styles/colors_viz.json";

const pt_arr = await fetchText(ptCloudPath); // PointCloud
const grid_arr = await fetchText(gridPath); // Array with locations of grid points
const grid_res = await fetchText(resPath);
var grid_vals = await fetchJSON(valsPath); // Array with the detections
grid_vals = grid_vals.data;
const colors = await fetchJSON(colorsPath); // Color gradients
fetchRGB(colors);

const amount = grid_arr.length * 6 + 1; // Max bars instances as the max grid cells
var ptCloud = await geomPTCloud(pt_arr, new THREE.Color("rgb(100,100,100))"));

var ch_options = {
  title: "",
  legend: "never",
  ylabel: "Flow",
  height: 200,
  strokeWidth: 3,
  fillAlpha: 0.2,
  fillGraph: true,
  rollPeriod: 5,
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

    // Check if indexes are within range selector
    for (let id = 0; id < grid_vals.length; id++) {
      let dt = grid_vals[id].timestamp;
      if (chart_range[0] <= dt && dt <= chart_range[1]) {
        id_arr.push(id);
      }

      if (id_arr.length < 2) {
        time_range = [0, 0];
      } else {
        time_range = [id_arr[0], id_arr.slice(-1)[0]]; // Store values in time_range
      }
    }
    // });
  },
};

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
  const w = 0.05;
  const d = 0.05;
  const h = 1;

  let geometry = new THREE.BoxGeometry(w, h, d);
  let material = new THREE.MeshBasicMaterial({
    opacity: 1,
    transparent: true,
  });

  bars = new THREE.InstancedMesh(geometry, material, amount);
  bars.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame
  scene.add(bars);

  // Reset time range threshold values
  time_range = [0, grid_vals.length];
}

function makeBaseGrid() {
  // Draw base grid mesh
  const dim = 0.25;
  const geometry = new THREE.BoxGeometry(dim, 0, dim);
  const edges = new THREE.EdgesGeometry(geometry);

  const lines = new THREE.Group();
  for (let x = 0; x < grid_res[0].X; x++) {
    for (let z = 0; z < grid_res[0].Y; z++) {
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
          color: new THREE.Color("rgb(50,50,50)"),
          linewidth: 0.1,
        })
      );
      // line.position.set(dim, 0, dim); // Re-center on the corner
      line.position.set(z * dim, 0, x * dim);
      line.translateX(+dim / 2).translateZ(+dim / 2);
      lines.add(line);
    }
  }
  scene.add(lines);
}

function render() {
  filter = document.querySelector(".db_filter.active").id;

  let detections = grid_vals;

  // Inputs ---------------------------------------------
  let fac_H = sldHeight.noUiSlider.get(); // Z exaggerating factor
  let fac_W = sldWidth.noUiSlider.get(); // Width exaggerating factor
  let filt_clip = sldClip.noUiSlider.get(); // Clip Min Max
  let fac_Sk = sldSkew.noUiSlider.get(); // Skewing factor
  let key_foc = $(".selection.dropdown").dropdown("get value"); // Filter focus key
  let filt_foc = sldFoc.noUiSlider.get(); // Filter focus distance

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
  let f = keys.indexOf(filter);
  let key = filter;
  let colors_sel = colors[key]; // Prepare Color gradients

  // Loop for values of filters
  for (let i = 0; i < subdiv[f]; i++) {
    let vals_filt = [];
    // Prepare filtered values
    for (const detection of detections) {
      if (detection[key] == i) {
        vals_filt.push(detection.id);
      }
    }

    // Count occurencies per id
    let counts = [...Array(grid_arr.length)].map((x) => 0);
    for (const num of vals_filt) {
      counts[num] = counts[num] + 1;
    }
    let cMax = Math.max(...Object.values(counts)); // Extract max occurencies for color gradient
    let cMin = Math.min(...Object.values(counts)); // Extract min occ for remap
    let baseRange = [cMin, cMax];
    let skewRange = [Math.pow(cMin, fac_Sk), Math.pow(cMax, fac_Sk)];

    const gradient = new Gradient()
      .setColorGradient("#000000", colors_sel[i])
      .setMidpoint((cMax / 2) * filt_clip[1]); // Extract Mid point based on cMax and the SldClip

    for (let id = 0; id < grid_arr.length; id++) {
      if (counts[id]) {
        if (
          filt_clip[0] * cMax <= counts[id] &&
          counts[id] <= filt_clip[1] * cMax
        ) {
          if (
            grid_arr[id][key_foc] <= filt_foc ||
            typeof grid_arr[id][key_foc] == "undefined"
          ) {
            const color = gradient.getColor(counts[id]); // Extract color gradient

            // Positions
            const x = parseFloat(grid_arr[id].X);
            const y = parseFloat(grid_arr[id].Y);
            const z = parseFloat(grid_arr[id].Z);
            dummy.position.set(x, 0, z);

            let scaleY =
              remapValue(Math.pow(counts[id], fac_Sk), skewRange, baseRange) *
              fac_H;
            let scaleXZ = (counts[id] / cMax) * fac_W + 1;
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
  while (j < amount) {
    j++;
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    bars.setMatrixAt(j, dummy.matrix);
  }

  // Enable update properties in loop
  bars.instanceMatrix.needsUpdate = true;
  bars.instanceColor.needsUpdate = true;

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

  let positions = [
    [-100, 100, -100],
    [0, 100, -0.0000001],
  ];
  camera.position.set(...positions[i]);

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

async function drawChart() {
  // Update Chart on UI selector
  setTimeout(async function () {
    let filter = document.querySelector(".db_filter.active").id;

    // Selected key
    let f = keys.indexOf(filter);
    let key = filter;
    let colors_sel = colors[key]; // Prepare Color gradients
    // Options for chart
    let ch_lim = grid_vals.slice(-1)[0].timestamp; // Upper X limit of chart (timestamp of last detection)
    let db = [range(0, ch_lim - 1)]; // Prepare db with indexes to store values

    // Loop for values of filters
    for (let i = 0; i < subdiv[f]; i++) {
      let vals_filt = [];
      let timeStamp_filt = [];

      // Prepare filtered values
      for (const detection of grid_vals) {
        if (detection[key] == i) {
          vals_filt.push(detection.id);
          timeStamp_filt.push(detection.timestamp);
        }
      }

      // Update Chart
      let offset = 0.1 * i;
      let ch_counts = [...Array(ch_lim)].map((x) => offset);
      for (const num of timeStamp_filt) {
        ch_counts[num] = ch_counts[num] + 1; // Count occurrencies per timestamp
      }

      db.push([...Object.values(ch_counts)].concat()); // Store values for chart

      if (i == 0) {
        try {
          chart.destroy();
        } catch (e) {}
      }
    }

    const t_db = db[0].map((_, colIndex) => db.map((row) => row[colIndex])); // Transpose arrays for viz
    await new Dygraph(chart, t_db, ch_options).updateOptions({
      colors: colors_sel,
      labels: ["id", "d1", "d2", "d3", "d4", "d5", "d6"],
    });
  }, 0);
}
document
  .querySelectorAll(".db_filter")
  .forEach((input) => input.addEventListener("click", drawChart));

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
  start: 9,
  connect: "lower",
  range: {
    min: 0,
    max: 9,
  },
});

document.getElementById("btn_reset").addEventListener("click", resetSlider);
function resetSlider() {
  let vals = [0.5, 1.5, [0, 1], 3, 9];
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

// ---------------------------------------------------------------------------------------------- INIT
init();
makeBaseGrid();
drawChart();
animate();
