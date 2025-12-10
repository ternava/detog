const baselines = {
    kubernetes: { name: 'Kubernetes', color: '#326CE5', churn: 10.2, netAcc: 1.5, cleanup: 0.74, density: 0.016, lifespan: 6.1 },
    gitlab: { name: 'GitLab', color: '#FC6D26', churn: 104.5, netAcc: 6.5, cleanup: 0.88, density: 0.081, lifespan: 6.2 }
};

const thresholds = {
    churn: { low: 15, high: 100 },
    netAcc: { low: 2, high: 5 },
    cleanup: { low: 0.85, high: 0.70 },
    density: { low: 0.02, high: 0.10 },
    lifespan: { low: 3, high: 8 }
};

let userMetrics = null;
let radarChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initRadarChart();
    loadCommunityProjects();
});

function initRadarChart() {
    Chart.register(ChartDataLabels);
    const ctx = document.getElementById('radarChart').getContext('2d');
    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['C', 'N', 'R', 'D', 'S'],
            datasets: [
                {
                    label: 'Kubernetes',
                    data: normalizeForRadar(baselines.kubernetes),
                    rawData: [baselines.kubernetes.churn, baselines.kubernetes.netAcc, baselines.kubernetes.cleanup, baselines.kubernetes.density, baselines.kubernetes.lifespan],
                    borderColor: '#326CE5',
                    backgroundColor: 'rgba(50, 108, 229, 0.15)',
                    pointBackgroundColor: '#326CE5',
                    pointBorderColor: '#000',
                    pointBorderWidth: 1,
                    borderWidth: 2
                },
                {
                    label: 'GitLab',
                    data: normalizeForRadar(baselines.gitlab),
                    rawData: [baselines.gitlab.churn, baselines.gitlab.netAcc, baselines.gitlab.cleanup, baselines.gitlab.density, baselines.gitlab.lifespan],
                    borderColor: '#FC6D26',
                    backgroundColor: 'rgba(252, 109, 38, 0.15)',
                    pointBackgroundColor: '#FC6D26',
                    pointBorderColor: '#000',
                    pointBorderWidth: 1,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { stepSize: 25, display: false },
                    grid: { color: 'rgba(0,0,0,0.1)' },
                    angleLines: { color: 'rgba(0,0,0,0.1)' },
                    pointLabels: { font: { size: 13, weight: 'bold' } }
                }
            },
            plugins: {
                legend: { display: false },
                datalabels: {
                    display: true,
                    color: function(context) {
                        return context.dataset.borderColor;
                    },
                    font: { size: 9, weight: 'bold' },
                    anchor: 'end',
                    align: 'end',
                    offset: 4,
                    formatter: function(value, context) {
                        const raw = context.dataset.rawData[context.dataIndex];
                        const formats = [v => v.toFixed(1), v => v.toFixed(1), v => v.toFixed(2), v => v.toFixed(3), v => v.toFixed(1)];
                        return formats[context.dataIndex](raw);
                    }
                }
            }
        }
    });
}

function normalizeForRadar(data) {
    return [
        Math.min((data.churn / 120) * 100, 100),
        Math.min((data.netAcc / 8) * 100, 100),
        data.cleanup * 100,
        Math.min((data.density / 0.12) * 100, 100),
        Math.min((data.lifespan / 10) * 100, 100)
    ];
}

function updateRadarChart() {
    if (!userMetrics) {
        if (radarChart.data.datasets.length > 2) {
            radarChart.data.datasets.pop();
            radarChart.update();
        }
        // Reset legend label
        document.getElementById('userProjectLabel').textContent = 'Your Project';
        return;
    }
    const projectName = document.getElementById('projectName').value || 'Your Project';
    
    // Update legend label
    document.getElementById('userProjectLabel').textContent = projectName;
    
    const userData = {
        label: projectName,
        data: normalizeForRadar(userMetrics),
        rawData: [userMetrics.churn, userMetrics.netAcc, userMetrics.cleanup, userMetrics.density, userMetrics.lifespan],
        borderColor: '#2ca02c',
        backgroundColor: 'rgba(44, 160, 44, 0.15)',
        pointBackgroundColor: '#2ca02c',
        pointBorderColor: '#000',
        pointBorderWidth: 1,
        borderWidth: 2
    };
    if (radarChart.data.datasets.length > 2) {
        radarChart.data.datasets[2] = userData;
    } else {
        radarChart.data.datasets.push(userData);
    }
    radarChart.update();
}

function calculateMetrics() {
    const v = ['activeToggles', 'additions', 'removals', 'linesOfCode', 'analysisPeriod', 'medianLifespan', 'releaseCycle']
        .map(id => parseFloat(document.getElementById(id).value));
    
    if (v.some(isNaN)) {
        alert('Please fill all fields with valid numbers.');
        return;
    }
    
    userMetrics = {
        churn: (v[1] + v[2]) / v[4],
        netAcc: (v[1] - v[2]) / v[4],
        cleanup: v[1] > 0 ? v[2] / v[1] : 0,
        density: (v[0] / v[3]) * 1000,
        lifespan: v[6] > 0 ? v[5] / v[6] : 0
    };
    
    displayMetricsResults();
    updateRadarChart();
}

function displayMetricsResults() {
    const m = [
        { name: 'churn rate (C) ', val: userMetrics.churn.toFixed(1), unit: '/month', th: thresholds.churn, inv: false },
        { name: 'net accumulation (N) ', val: userMetrics.netAcc.toFixed(1), unit: '/month', th: thresholds.netAcc, inv: false },
        { name: 'cleanup ratio (R) ', val: userMetrics.cleanup.toFixed(2), unit: '', th: thresholds.cleanup, inv: true },
        { name: 'toggle density (D) ', val: userMetrics.density.toFixed(3), unit: '/kLoC', th: thresholds.density, inv: false },
        { name: 'norm. lifespan (S) ', val: userMetrics.lifespan.toFixed(1), unit: ' cycles', th: thresholds.lifespan, inv: false }
    ];
    
    document.getElementById('metricsResults').innerHTML = m.map(x => {
        const z = getZone(parseFloat(x.val), x.th, x.inv);
        return `<div class="metric-result ${z}"><div><span class="name">${x.name}</span><span class="zone-badge ${z}">${z}</span></div><div class="value">${x.val}${x.unit}</div></div>`;
    }).join('');
}

function getZone(v, th, inv) {
    if (inv) return v >= th.low ? 'low' : v >= th.high ? 'moderate' : 'high';
    return v < th.low ? 'low' : v < th.high ? 'moderate' : 'high';
}

function clearForm() {
    document.querySelectorAll('.input-panel input').forEach(i => i.value = '');
    document.getElementById('metricsResults').innerHTML = '<p style="color:#666;font-style:italic;">enter data and click Calculate.</p>';
    userMetrics = null;
    updateRadarChart();
}

function saveProject() {
    if (!userMetrics) {
        alert('Calculate metrics first.');
        return;
    }
    
    const projectName = document.getElementById('projectName').value || 'Unnamed';
    const timestamp = new Date().toISOString();
    
    // Save to localStorage
    const projects = JSON.parse(localStorage.getItem('detogProjects') || '[]');
    projects.push({
        name: projectName,
        date: timestamp,
        metrics: userMetrics
    });
    localStorage.setItem('detogProjects', JSON.stringify(projects));
    loadCommunityProjects();
    
    // Also save to CSV file download
    const csvRow = [
        projectName,
        timestamp,
        userMetrics.churn.toFixed(2),
        userMetrics.netAcc.toFixed(2),
        userMetrics.cleanup.toFixed(4),
        userMetrics.density.toFixed(6),
        userMetrics.lifespan.toFixed(2),
        document.getElementById('activeToggles').value,
        document.getElementById('additions').value,
        document.getElementById('removals').value,
        document.getElementById('linesOfCode').value,
        document.getElementById('analysisPeriod').value,
        document.getElementById('medianLifespan').value,
        document.getElementById('releaseCycle').value
    ].join(',');
    
    // Check if we have existing CSV data in localStorage
    let csvData = localStorage.getItem('detogProjectsCSV') || 'project_name,timestamp,churn_rate,net_accumulation,cleanup_ratio,toggle_density,norm_lifespan,active_toggles,additions,removals,lines_of_code,analysis_period_months,median_lifespan_days,release_cycle_days';
    csvData += '\n' + csvRow;
    localStorage.setItem('detogProjectsCSV', csvData);
    
    alert('Project saved! Use "Export Data" to download CSV file.');
}

function exportData() {
    const csvData = localStorage.getItem('detogProjectsCSV');
    if (!csvData || csvData.split('\n').length <= 1) {
        alert('No projects saved yet.');
        return;
    }
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'detog-projects.csv';
    a.click();
}

function loadCommunityProjects() {
    const p = JSON.parse(localStorage.getItem('detogProjects') || '[]');
    document.getElementById('communityList').innerHTML = p.length
        ? p.map((x, i) => `<div class="project-item"><div><strong>${x.name}</strong><br><small>${new Date(x.date).toLocaleDateString()}</small></div><div><button class="btn btn-secondary" style="padding:0.2rem 0.4rem;font-size:0.75rem;" onclick="loadProject(${i})">Load</button> <button class="btn btn-secondary" style="padding:0.2rem 0.4rem;font-size:0.75rem;" onclick="deleteProject(${i})">Delete</button></div></div>`).join('')
        : '<p style="color:#666;">No projects saved yet.</p>';
}

function loadProject(i) {
    const p = JSON.parse(localStorage.getItem('detogProjects'))[i];
    userMetrics = p.metrics;
    
    // Set the project name in the input field so legend updates correctly
    document.getElementById('projectName').value = p.name;
    
    displayMetricsResults();
    updateRadarChart();
    switchTab('comparison');
}

function deleteProject(i) {
    if (!confirm('Delete this project?')) return;
    const p = JSON.parse(localStorage.getItem('detogProjects'));
    p.splice(i, 1);
    localStorage.setItem('detogProjects', JSON.stringify(p));
    loadCommunityProjects();
}

function handleImport(e) {
    const r = new FileReader();
    r.onload = x => {
        try {
            const content = x.target.result;
            const filename = e.target.files[0].name;
            
            if (filename.endsWith('.csv')) {
                // Import CSV
                const existingCSV = localStorage.getItem('detogProjectsCSV') || 'project_name,timestamp,churn_rate,net_accumulation,cleanup_ratio,toggle_density,norm_lifespan,active_toggles,additions,removals,lines_of_code,analysis_period_months,median_lifespan_days,release_cycle_days';
                const newLines = content.split('\n').slice(1).filter(line => line.trim()); // Skip header
                if (newLines.length > 0) {
                    localStorage.setItem('detogProjectsCSV', existingCSV + '\n' + newLines.join('\n'));
                }
                
                // Also parse and add to localStorage projects
                newLines.forEach(line => {
                    const cols = line.split(',');
                    if (cols.length >= 7) {
                        const projects = JSON.parse(localStorage.getItem('detogProjects') || '[]');
                        projects.push({
                            name: cols[0],
                            date: cols[1],
                            metrics: {
                                churn: parseFloat(cols[2]),
                                netAcc: parseFloat(cols[3]),
                                cleanup: parseFloat(cols[4]),
                                density: parseFloat(cols[5]),
                                lifespan: parseFloat(cols[6])
                            }
                        });
                        localStorage.setItem('detogProjects', JSON.stringify(projects));
                    }
                });
                loadCommunityProjects();
                alert('CSV imported successfully!');
            } else {
                // Import JSON (legacy support)
                const d = JSON.parse(content);
                const ex = JSON.parse(localStorage.getItem('detogProjects') || '[]');
                localStorage.setItem('detogProjects', JSON.stringify([...ex, ...d]));
                loadCommunityProjects();
                alert('JSON imported successfully!');
            }
        } catch (err) {
            alert('Invalid file format.');
        }
    };
    r.readAsText(e.target.files[0]);
    e.target.value = ''; // Reset file input
}

function switchTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${id}')"]`).classList.add('active');
    document.getElementById(id).classList.add('active');
}