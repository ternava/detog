+++
title = "Toggle Chart Guide"
+++

# Toggle Chart Guide

This page shows an interactive chart of feature-gate toggles (added vs removed) over time. The chart fetches data every minute from the CSV.

<div id="vis"></div>

<script src="https://cdn.jsdelivr.net/npm/vega@5"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-lite@4"></script>
<script src="https://cdn.jsdelivr.net/npm/vega-embed@6"></script>
<script>
const spec = {
  "description": "Added vs Removed feature gates over time",
  "data": {
    "url": "/data/feature_gates_events.csv",
    "format": {"type": "csv", "parse": {"date": "date"}}
  },
  "transform": [
    {"aggregate": [{"op": "count", "as": "count"}], "groupby": ["date","event"]}
  ],
  "width": 800,
  "height": 400,
  "mark": "line",
  "encoding": {
    "x": {"field": "date", "type": "temporal", "title": "Date"},
    "y": {"field": "count", "type": "quantitative", "title": "Number of Toggles"},
    "color": {"field": "event", "type": "nominal", "title": "Event"}
  }
};

function draw() {
  vegaEmbed('#vis', spec, {actions:false});
}

// setInterval(draw, 60000); - this is every minute
// refresh data every 6 hours (6h = 6*60*60*1000ms)
setInterval(draw, 1000 * 60 * 60 * 6);
draw();
</script>