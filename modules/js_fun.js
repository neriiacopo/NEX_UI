function show(id) {
  let elem = document.getElementById(id);
  if (elem.classList.contains("hidden")) {
    // Keep active
    elem.classList.toggle("hidden");
    elem.classList.toggle("block");

    let siblings = getSiblings(elem);
    siblings.forEach(function (input) {
      // Deactivate Siblings
      if (input.classList.contains("block")) {
        input.classList.toggle("hidden");
        input.classList.toggle("block");
      }
    });
  }
}

function showHandles() {
  var classes = [".dygraph-rangesel-fgcanvas", ".dygraph-rangesel-zoomhandle"];

  var elems = document.querySelectorAll(classes);
  elems.forEach(function (elem) {
    elem.classList.toggle("visible");
    elem.classList.toggle("invisible");
  });
  console.log(elems);
}

function blurIn() {
  let blur = document.getElementById("base_blur");

  if (!blur.classList.contains("blur_in")) {
    blur.classList.toggle("blur_in");
    blur.classList.toggle("blur_out");
  }
}

function blurOut() {
  let blur = document.getElementById("base_blur");

  if (!blur.classList.contains("blur_out")) {
    blur.classList.toggle("blur_in");
    blur.classList.toggle("blur_out");
  }
}

function getSiblings(e) {
  let siblings = [];
  if (!e.parentNode) {
    return siblings;
  }
  // first child of the parent node
  let sibling = e.parentNode.firstChild;
  while (sibling) {
    if (sibling.nodeType === 1 && sibling !== e) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling;
  }
  return siblings;
}

function getChild(e) {
  let nodes = e.childNodes;
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeName.toLowerCase() == "div") {
      nodes[i].style.background = color;
    }
  }
}

function tglActive(elem) {
  if (!elem.classList.contains("active")) {
    elem.classList.add("active");
  }

  let siblings = getSiblings(elem);
  siblings.forEach(function (input) {
    input.classList.remove("active");
  });
}

function resetMenu() {
  resetBtns();
  resetTabs();
}

function resetBtns() {
  let btns = document.querySelectorAll(".head_btns");
  btns.forEach(function (input) {
    input.classList.remove("active");
  });
}

function resetTabs() {
  let blur = document.getElementById("base_blur");
  let tabs = document.querySelectorAll(".tab");
  tabs.forEach(function (input) {
    input.classList.add("hidden");
  });
}

function showTab(id) {
  let tab;
  let idsBlur = ["insights", "gathering"];
  let blur = document.getElementById("base_blur");

  // Reset setting
  resetTabs();
  blur.classList.add("blur_out");
  blur.classList.remove("blur_in");

  // Selected visibility
  tab = document.getElementById(id);
  tab.classList.remove("hidden");
  tab.classList.add("block");

  // If matching the idsBlur activate blur
  if (idsBlur.indexOf(id) > -1) {
    blur.classList.remove("blur_out");
    blur.classList.add("blur_in");
  }
}

function changePage(id) {
  var reports_ids = ["report_1", "report_2", "report_3"];

  reports_ids.forEach(function (input) {
    let report = document.getElementById(input);
    report.classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
}

function activateLayer(id) {
  let layers = document.getElementsByClassName("db_filter");
  Array.from(layers).forEach(function (input) {
    input.classList.remove("active");
  });

  let layer = document.getElementById(id);
  layer.classList.add("active");
}

function changeProd(id) {
  var card = {
    img: "card_img",
    name: "p_name",
    days: "p_days",
    price: "p_price",
    gaze: "lineb_1",
    focus: "lineb_2",
    interaction: "lineb_3",
  };

  var products = [
    {
      name: "Nike Air Jordan",
      days: 35,
      price: 9.312,
      url: "https://static.nike.com/a/images/t_default/2016a636-2953-41b4-b496-55263f2b26bc/air-jordan-1-mid-zapatillas-6L9QW1.png",
      gaze: 40,
      focus: 34,
      interaction: 84,
    },
    {
      name: "Nike Air Dior",
      days: 12,
      price: 3.567,
      url: "https://sneakerstrendz.com/wp-content/uploads/2020/06/air-jordan-1-x-dior.jpg",
      gaze: 22,
      focus: 56,
      interaction: 34,
    },
    {
      name: "Nike Air Off White",
      price: 5.677,
      days: 42,
      url: "https://myreact.ru/wp-content/uploads/2020/08/img01-30.jpg",
      gaze: 55,
      focus: 43,
      interaction: 67,
    },
  ];

  let prod = products[id];
  document.getElementById(card["img"]).src = prod["url"];
  document.getElementById(card["name"]).innerHTML = prod["name"];
  document.getElementById(card["price"]).innerHTML = String(
    prod["price"]
  ).concat(" $");
  document.getElementById(card["days"]).innerHTML =
    ["On display for "] + String(prod["days"]) + " days";
  document.getElementById(card["gaze"]).style.width = String(
    prod["gaze"]
  ).concat("%");
  document.getElementById(card["focus"]).style.width = String(
    prod["focus"]
  ).concat("%");
  document.getElementById(card["interaction"]).style.width = String(
    prod["interaction"]
  ).concat("%");

  console.log(document.getElementById(card["img"]));
}
