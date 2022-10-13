export async function drawPies(grid_vals, keys, colors, subdiv) {}

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
    for (let id = 0; id < detections.length; id++) {
      let dt = detections[id].timestamp;
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

export async function drawChart(grid_vals, keys, colors, subdiv, time_range) {
  detections = await grid_vals;
  // Update Chart on UI selector
  setTimeout(async function () {
    let filter = document.querySelector(".db_filter.active").id;
    console.log(filter);
    console.log(keys);

    // Selected key
    let f = keys.indexOf(filter);
    let key = filter;
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
