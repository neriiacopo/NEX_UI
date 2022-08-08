import * as THREE from "three";
import { Gradient } from "jsGradient";

let pointlight;

let colorsPath = "./styles/colors_viz.json";
let colors = await fetchJSON(colorsPath);
fetchRGB(colors);

export function range(start, end) {
  return Array(end - start + 1)
    .fill()
    .map((_, idx) => start + idx);
}

export function remapValue(value, r1, r2) {
  return ((value - r1[0]) * (r2[1] - r2[0])) / (r1[1] - r1[0]) + r2[0];
}

export function csvToArray(str, delimiter = ";") {
  let arr = [];
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str
    .slice(0, str.indexOf("\n"))
    .replace("\r", "")
    .split(delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str
    .slice(str.indexOf("\n") + 1)
    .replace("\r", "")
    .split("\n");

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
}

export function addLight(scene) {
  pointlight = new THREE.PointLight(0xffffff, 1);
  pointlight.position.set(2, 2, 2);

  scene.add(pointlight);

  const light = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(light);
}

export async function fetchText(url) {
  let response = await fetch(url);
  let data = await response.text();
  let csv = csvToArray(data);
  return csv;
}

export async function fetchJSON(url) {
  let response = await fetch(url);
  let promise = await response.json();
  return await promise;
}

export function fetchRGB(obj) {
  const keys = Object.keys(obj);

  keys.forEach((key, index) => {
    let arrHex = [];
    for (const colObj of obj[key]) {
      arrHex.push(colObj.HEX);
    }
    obj[key] = arrHex;
  });
}

export async function geomPTCloud(arr, color) {
  let ptcloud;

  const geom = new THREE.BufferGeometry();
  const positions = [];

  for (let i = 0; i < arr.length; i++) {
    // positions
    const x = parseFloat(arr[i].X);
    const y = parseFloat(arr[i].Y);
    const z = parseFloat(arr[i].Z);

    positions.push(x, y, z);
  }

  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

  geom.computeBoundingSphere();

  let material = new THREE.PointsMaterial({
    size: 0.001,
    color: color,
    vertexColors: false,
  });

  ptcloud = new THREE.Points(geom, material);
  return ptcloud;
}

export async function geomGrid(arr, detections, scene, filter = "gender") {
  let colors_sel = [];

  if (filter == "gender") {
    colors_sel = colors.gender;

    for (let i = 0; i < 2; i++) {
      let vals_filt = [];
      let timeStamp_filt = [];

      // Filter values
      for (const detection of detections) {
        if (detection.gender == i) {
          vals_filt.push(detection.id);
          timeStamp_filt.push(detection.timestamp);
        }
      }

      // Make geometries
      let boxGrid = makeGrid(arr, vals_filt, colors_sel[i]);

      // Translate depending on sub-grid level
      let TranslX = [];
      if (i == 0) {
        TranslX = 0.1 / 2;
      } else {
        TranslX = -0.1 / 2;
      }
      boxGrid.translateX(TranslX);
      boxGrid.name = "grid";
      scene.add(boxGrid);
    }
  } else if (filter == "age") {
    colors_sel = colors.age;

    for (let i = 0; i < 4; i++) {
      let vals_filt = [];
      let timeStamp_filt = [];
      // Filter values
      for (const detection of detections) {
        if (detection.age == i) {
          vals_filt.push(detection.id);
          timeStamp_filt.push(detection.timestamp);
        }
      }
      // Make geometries
      let boxGrid = makeGrid(arr, vals_filt, colors_sel[i]);

      // Translate depending on sub-grid level
      let v = 0.1 / 2;
      let TranslX = [v, v, -v, -v];
      let TranslZ = [v, -v, v, -v];
      boxGrid.translateX(TranslX[i]);
      boxGrid.translateZ(TranslZ[i]);
      boxGrid.name = "grid";
      scene.add(boxGrid);
    }
  } else if (filter == "group") {
    colors_sel = colors.group;

    for (let i = 0; i < 6; i++) {
      let vals_filt = [];
      let timeStamp_filt = [];
      // Filter values
      for (const detection of detections) {
        if (detection.group == i) {
          vals_filt.push(detection.id);
          timeStamp_filt.push(detection.timestamp);
        }
      }
      // Make geometries
      let boxGrid = makeGrid(arr, vals_filt, colors_sel[i]);

      // Translate depending on sub-grid level
      let v = 0.1 / 2;
      let TranslX = [v, v, v, -v, -v, -v];
      let Translz = [v, -v, 0, 0, v, -v];
      boxGrid.translateX(TranslX[i]).translateZ(Translz[i]);
      boxGrid.name = "grid";

      scene.add(boxGrid);
    }
  }
}

function makeGrid(arr, v_id, color2, color1 = "#646464", scene, f = 0.5) {
  // Count occurencies per id
  let counts = [...Array(arr.length)].map((x) => 0);
  for (const num of v_id) {
    counts[num] = counts[num] + 1;
  }

  // Extract current max value
  let cMax = Math.max(...Object.values(counts));
  // // Harmonize counts values
  // for (const num of v_id) {
  //   counts[num] = counts[num] / cMax;
  // }

  // Create geometries
  const w = 0.05;
  const d = 0.05;
  const h = 1;

  const geom = new THREE.BoxGeometry(w, h, d);

  const gradient = new Gradient()
    .setColorGradient(color1, color2)
    .setMidpoint(cMax);

  const geomGroup = new THREE.Group();

  // Make base grid
  for (let i = 0; i < arr.length; i++) {
    if (counts[i]) {
      // Extract color gradient
      const color = gradient.getColor(counts[i]);

      let material = new THREE.MeshBasicMaterial({
        color: color,
        opacity: 1,
        transparent: true,
      });

      let box = new THREE.Mesh(geom, material);

      // positions
      const x = parseFloat(arr[i].X);
      const y = parseFloat(arr[i].Y);
      const z = parseFloat(arr[i].Z);
      box.position.set(x, 0, z);

      // Make 2x2 sub-grid
      // Scale depending on values
      let scaleY = counts[i] * f;
      box.translateY(scaleY / 2);
      box.scale.set(1, scaleY, 1);

      geomGroup.add(box);
    }
  }

  return geomGroup;
}

export async function drawChart(chart, ch_options, keys) {
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
