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
  console.log(elem.classList);
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
