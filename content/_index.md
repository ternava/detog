+++
title = "deTOG - Feature Toggle Removal Hub"
+++

<!-- 
A comprehensive collection of resources focused on **removing feature toggles**

Feature toggles are powerful for deployment and experimentation, but they can accumulate over time. This site focuses specifically on state-of-the-art strategies, tools, and research for safely removing unused toggles and preventing toggle-related complexity.

 ## Recent additions

- New paper: "[Exploring Influence of Feature Toggles on Code Complexity](https://dl.acm.org/doi/abs/10.1145/3661167.3661190)" (2024)
- Added: ...
- Updated: ...
-->

## Added and removed feature toggles in Kubernetes and GitLab
<div id="vis"></div>

<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@4"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<script>
const spec = {
  "description": "Added vs Removed feature gates over time",
  "data": {
    "url": "data/feature_gates_events.csv",
    "format": {"type":"csv","parse":{"date":"date"}}
  },
  "transform": [
    {"aggregate":[{"op":"count","as":"count"}],"groupby":["date","event"]}
  ],
  "width":800,
  "height":400,
  "mark":"line",
  "encoding": {
    "x": {"field":"date","type":"temporal","title":"Date"},
    "y": {"field":"count","type":"quantitative","title":"Number of Toggles"},
    "color": {"field":"event","type":"nominal","title":"Event"}
  }
};

function draw() {
  vegaEmbed('#vis', spec, {actions:false});
}

setInterval(draw, 1000 * 60 * 60 * 6);
draw();
</script>