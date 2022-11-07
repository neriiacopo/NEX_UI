export async function drawPies(grid_vals, keys, colors, subdiv) {
  let detections = await grid_vals;

  let filter = $("#rep1_filt").dropdown("get value"); // Filter focus key
  const ids = ["pie_Gen", "pie_Age", "pie_Grp"];
  const titles = ["gender", "age", "group"];
  const labels = [
    ["Male", "Female"],
    ["Kids", "Young", "Adult", "Elderly"],
    [
      "Caucasian",
      "Indian",
      "Middle Eastern",
      "Afro American",
      "Asian",
      "Other",
    ],
  ];

  if (filter !== "") {
    let id_map = filter.split("_"); // Array with key and value matching the selected filter

    // Mask values based on filter
    const key = titles[id_map[0]];
    let detections_filt = [];
    // Prepare filtered values
    for (const detection of detections) {
      if (detection[key] == id_map[1]) {
        detections_filt.push(detection);
      }
    }
    detections = detections_filt;
  }

  for (let ind = 0; ind < ids.length; ind++) {
    const elem = document.getElementById(ids[ind]);
    const key = titles[ind];
    let f = keys.indexOf(key);
    let colors_sel = colors[key];
    let counts = [];

    // Loop for values of unique
    for (let i = 0; i < subdiv[f]; i++) {
      let vals_filt = [];
      // Prepare filtered values
      for (const detection of detections) {
        if (detection[key] == i) {
          vals_filt.push(detection.id);
        }
      }
      counts.push(vals_filt.length);
    }

    const centerLegend = {
      id: "text",
      afterDraw: function (chart, a, b) {
        var width = chart.width,
          height = chart.height,
          ctx = chart.ctx;

        ctx.restore();

        // Retrieve context data
        var d = chart.config._config.data;
        var values = d.datasets[0].data;
        var colors = d.datasets[0].backgroundColor;
        var lab = d.labels;

        // Set font based on .ui class
        var fontUi = getComputedStyle(document.querySelector(".ui"));
        ctx.font = parseInt(fontUi.fontSize) * 0.8 + "px " + fontUi.fontFamily; // Fixed

        if (ind == 0) {
          ctx.font =
            parseInt(fontUi.fontSize) * 1.5 + "px " + fontUi.fontFamily; // Fixed
        }

        ctx.textBaseline = "middle";

        // From abs to percentage
        let sum = 0;
        for (let i = 0; i < values.length; i++) {
          sum += values[i];
        }

        // Round to decimal
        // Math.round(numm * 100) / 100;

        for (let i = 0; i < values.length; i++) {
          // var paddPerc = 0.5;
          // var hStep = (height / values.length) * paddPerc; // Adaptive
          var hStep = 25; // Fixed

          var text = lab[i] + " " + Math.round((values[i] * 100) / sum) + "%", // Calculate percentage
            textX = Math.round((width - ctx.measureText(text).width) / 2),
            // textY = height / 2 + hStep * i + hStep / 2;
            textY =
              height / 2 - // Center
              (hStep * values.length) / 2 + // Half of the total text size
              hStep * i + // Step
              hStep / 2; // the center of the step

          // ctx.fillStyle = colors[i];
          let color = values[i] == 0 ? "#808080" : "#FFFFFF";
          ctx.fillStyle = color;
          ctx.fillText(text, textX, textY);
          ctx.save();
        }
      },
    };

    let data = {
      labels: labels[ind],
      datasets: [
        {
          data: counts,
          backgroundColor: colors_sel,
          borderWidth: 0,
        },
      ],
    };

    let canvas = Chart.getChart(ids[ind]);
    if (typeof canvas == "undefined") {
      new Chart(elem, {
        type: "doughnut",
        id: ids[ind],
        data: data,
        options: {
          events: [],
          cutout: "90%",
          // animation: false,
          layout: {
            padding: 30,
          },
          responsive: true,
          plugins: {
            legend: {
              display: false,
            },
          },
        },
        plugins: [centerLegend],
      });
    } else {
      canvas.data = data;
      canvas.update();
    }
  }
}
