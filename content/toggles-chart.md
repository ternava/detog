+++
title = "Feature Toggle Trends"
url = "/toggles-chart/"
+++

<div id="chart" style="width:100%;height:600px;"></div>

<script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
<script>
Promise.all([
  new Promise((resolve, reject) => {
    Plotly.d3.tsv("/data/k8s_feature_toggles.tsv", (err, rows) => err ? reject(err) : resolve({ label: "K8s Toggles", rows }));
  }),
  new Promise((resolve, reject) => {
    Plotly.d3.tsv("/data/gitlab_feature_flags.tsv", (err, rows) => err ? reject(err) : resolve({ label: "GitLab Flags", rows }));
  })
]).then(results => {
  const traces = results.map(({ label, rows }) => {
    const counts = {};
    rows.forEach(r => {
      const year = new Date(r.date).getFullYear();
      counts[year] = (counts[year] || 0) + 1;
    });
    const years = Object.keys(counts).sort();
    return { x: years, y: years.map(y => counts[y]), type: 'scatter', mode: 'lines+markers', name: label };
  });
  Plotly.newPlot('chart', traces, {
    title: 'Feature Toggles Per Year',
    xaxis: { title: 'Year' },
    yaxis: { title: 'Number of Toggles' }
  });
}).catch(console.error);
</script>