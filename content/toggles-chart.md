+++
title = "Feature Toggle Trends"
url = "/toggles-chart/"
+++

<div id="chart" style="width:100%;height:600px;"></div>

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script>
  Plotly.d3.tsv("/data/k8s_feature_toggles.tsv", function(err, rows) {
    if (err) return console.error(err);
    const counts = {};
    rows.forEach(r => counts[r.version] = (counts[r.version] || 0) + 1);
    const x = Object.keys(counts);
    const y = Object.values(counts);
    Plotly.newPlot('chart', [
      { x: x, y: y, type: 'scatter', mode: 'lines+markers', name: 'K8s Toggles' }
    ], {
      title: 'Kubernetes Feature Toggles Over Time',
      xaxis: { title: 'Version' },
      yaxis: { title: 'Number of Toggles' }
    });
  });
</script>