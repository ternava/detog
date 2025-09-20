+++
title = "Feature Toggle Trends"
url = "/toggles-chart/"
+++

<div id="chart" style="width:100%;height:600px;"></div>

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script>
  Plotly.d3.tsv('{{ "data/k8s_releases.tsv" | relURL }}', function(err, rows) {
    if (err) return console.error(err);
    const dates = rows.map(r => new Date(r.date));
    const counts = rows.map(r => +r.count);
    Plotly.newPlot('chart', [{ x: dates, y: counts, type: 'bar' }], {
      title: 'Kubernetes Feature Toggles by Release',
      xaxis: { title: 'Release Date' },
      yaxis: { title: 'Number of Toggles' }
    });
  });
</script>