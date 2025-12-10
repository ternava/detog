+++
title = "Feature Toggle Hub"
+++

<!-- 
A comprehensive collection of resources focused on **removing feature toggles**

Feature toggles are powerful for deployment and experimentation, but they can accumulate over time. This site focuses specifically on state-of-the-art strategies, tools, and research for safely removing unused toggles and preventing toggle-related complexity.

 ## Recent additions

- New paper: "[Exploring Influence of Feature Toggles on Code Complexity](https://dl.acm.org/doi/abs/10.1145/3661167.3661190)" (2024)
- Added: ...
- Updated: ...
-->

## The count of added and removed feature toggles in software projects
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
  "width":650,
  "height":400,
  "mark": {
    "type": "line",
    "point": true    // show points for tooltip interactivity
  },
  "encoding": {
     "x": {
       "field": "date",
       "type": "temporal",
       "title": "Date",
       "axis": {
         "format": "%Y",
         "tickCount": {"interval": "year"}
       }
     },
      "y": {"field":"count","type":"quantitative","title":"Number of Toggles"},
     "color": {
       "field": "event",
       "type": "nominal",
       "title": "Event",
       "scale": {
         "domain": ["removed", "added"],
         "range": ["red", "blue"]
       },
       "legend": {
         "orient": "top-right"
       }
     },
     "tooltip": [
       {"field":"date","type":"temporal","title":"Date"},
       {"field":"count","type":"quantitative","title":"Count"},
       {"field":"event","type":"nominal","title":"Event"}
     ]
    }
  };

function draw() {
  vegaEmbed('#vis', spec, {actions:false});
}

setInterval(draw, 1000 * 60 * 60 * 6);
draw();
</script>

## Interactive Toggle List

<link rel="stylesheet" href="https://cdn.datatables.net/1.13.4/css/jquery.dataTables.min.css"/>
<script src="https://cdn.jsdelivr.net/npm/papaparse@5"></script>
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://cdn.datatables.net/1.13.4/js/jquery.dataTables.min.js"></script>

<table id="toggle-table" class="display" style="width:100%">
  <thead>
    <tr>
      <th>Feature Toggle</th>
      <th>Event</th>
      <th>Date</th>
      <th>SHA</th>
      <th>Line</th>
    </tr>
  </thead>
</table>

<script>
fetch("data/feature_gates_events.csv")
  .then(r => r.text())
  .then(text => {
    const rows = Papa.parse(text, { header: true }).data;
    const summary = {};
    rows.forEach(r => {
      const f = r.feature;
      summary[f] = summary[f] || { feature: f, created: null, removed: null };
      if (r.event === "added") {
        if (!summary[f].created || r.date < summary[f].created) summary[f].created = r.date;
      }
      if (r.event === "removed") {
        if (!summary[f].removed || r.date > summary[f].removed) summary[f].removed = r.date;
      }
    });
    const data = Object.values(summary).map(o => {
      const lifetime = o.created && o.removed
        ? Math.round((new Date(o.removed) - new Date(o.created)) / (1000 * 60 * 60 * 24))
        : "";
      return [o.feature, o.removed ? "removed" : "active", o.created, o.removed || "", lifetime];
    });
    $("#toggle-table").DataTable({
      data,
      columns: [
        { title: "Feature Toggle" },
        { title: "Event" },
        { title: "Date" },
        { title: "SHA" },
        { title: "Line" }
      ],
      order: [[2, "desc"]],
      pageLength: 25
    });
  });
</script>