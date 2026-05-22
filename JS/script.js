document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.getElementById("toggleMode");
    const numericalMode = document.getElementById("numericalMode");
    const graphMode = document.getElementById("graphMode");
    const toggleIcon = toggleButton.querySelector(".toggle-btn__icon");
    const toggleText = toggleButton.querySelector(".toggle-btn__text");

    let isGraphMode = false;
    let previousTemp = null;
    let previousHumidity = null;
    let chartInstance = null;

    // Toggle between numerical and graph mode
    toggleButton.addEventListener("click", () => {
        isGraphMode = !isGraphMode;
        if (isGraphMode) {
            numericalMode.classList.add("hidden");
            graphMode.classList.remove("hidden");
            toggleIcon.textContent = "🔢";
            toggleText.textContent = "Switch to Numerical Mode";
            renderGraph();
        } else {
            numericalMode.classList.remove("hidden");
            graphMode.classList.add("hidden");
            toggleIcon.textContent = "📊";
            toggleText.textContent = "Switch to Graph Mode";
        }
    });

    // Initial fetch
    fetchData();

    // Fetch every 15 seconds
    setInterval(fetchData, 15000);

    function fetchData() {
        fetch('https://api.thingspeak.com/channels/3348815/feeds.json?api_key=UAISGE3RC2SPYFXG')
            .then(response => response.json())
            .then(data => {
                const feeds = data.feeds;
                if (!feeds || feeds.length === 0) return;

                const latest = feeds[feeds.length - 1];
                const temperature = parseFloat(latest.field1);
                const humidity = parseFloat(latest.field2);

                // Update temperature display
                const tempEl = document.getElementById('temperature');
                tempEl.innerHTML = `${temperature.toFixed(1)}<span class="card__unit"> °C</span>`;

                // Update humidity display
                const humidEl = document.getElementById('humidity');
                humidEl.innerHTML = `${humidity.toFixed(1)}<span class="card__unit"> %</span>`;

                // Update progress bars
                // Temperature bar: 0°C = 0%, 50°C = 100%
                const tempPercent = Math.min(Math.max((temperature / 50) * 100, 0), 100);
                document.getElementById('temp-bar').style.width = tempPercent + '%';

                // Humidity bar: 0-100%
                const humidPercent = Math.min(Math.max(humidity, 0), 100);
                document.getElementById('humid-bar').style.width = humidPercent + '%';

                // Update trend indicators
                updateTrend('temp-trend', temperature, previousTemp);
                updateTrend('humid-trend', humidity, previousHumidity);

                previousTemp = temperature;
                previousHumidity = humidity;

                // Update status
                document.getElementById('connection-status').textContent = 'Sensor Online';
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                document.getElementById('last-update').textContent = `Last update: ${timeStr}`;
            })
            .catch(error => {
                console.error('Error fetching ThingSpeak data:', error);
                document.getElementById('connection-status').textContent = 'Connection Error';
            });
    }

    function updateTrend(elementId, current, previous) {
        const el = document.getElementById(elementId);
        if (previous === null) {
            el.innerHTML = '<span>—</span>';
            return;
        }
        const diff = current - previous;
        if (Math.abs(diff) < 0.01) {
            el.innerHTML = '<span>→ Stable</span>';
        } else if (diff > 0) {
            el.innerHTML = `<span>↑ +${diff.toFixed(1)}</span>`;
            el.style.color = '#f97316';
        } else {
            el.innerHTML = `<span>↓ ${diff.toFixed(1)}</span>`;
            el.style.color = '#06b6d4';
        }
    }

    function renderGraph() {
        fetch('https://api.thingspeak.com/channels/3348815/feeds.json?api_key=UAISGE3RC2SPYFXG&results=20')
            .then(response => response.json())
            .then(data => {
                const labels = [];
                const tempData = [];
                const humidityData = [];

                data.feeds.forEach(feed => {
                    const date = new Date(feed.created_at);
                    labels.push(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    tempData.push(parseFloat(feed.field1));
                    humidityData.push(parseFloat(feed.field2));
                });

                // Destroy existing chart instance if it exists
                if (chartInstance) {
                    chartInstance.destroy();
                }

                const ctx = document.getElementById("dataChart").getContext("2d");

                // Create gradient fills
                const tempGradient = ctx.createLinearGradient(0, 0, 0, 400);
                tempGradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
                tempGradient.addColorStop(1, 'rgba(249, 115, 22, 0)');

                const humidGradient = ctx.createLinearGradient(0, 0, 0, 400);
                humidGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
                humidGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

                chartInstance = new Chart(ctx, {
                    type: "line",
                    data: {
                        labels: labels,
                        datasets: [
                            {
                                label: "Temperature (°C)",
                                data: tempData,
                                borderColor: "#f97316",
                                backgroundColor: tempGradient,
                                borderWidth: 2.5,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4,
                                pointBackgroundColor: '#f97316',
                                pointBorderColor: '#0a0e1a',
                                pointBorderWidth: 2,
                                pointHoverRadius: 7,
                                pointHoverBackgroundColor: '#f97316',
                                pointHoverBorderColor: '#fff',
                            },
                            {
                                label: "Humidity (%)",
                                data: humidityData,
                                borderColor: "#06b6d4",
                                backgroundColor: humidGradient,
                                borderWidth: 2.5,
                                fill: true,
                                tension: 0.4,
                                pointRadius: 4,
                                pointBackgroundColor: '#06b6d4',
                                pointBorderColor: '#0a0e1a',
                                pointBorderWidth: 2,
                                pointHoverRadius: 7,
                                pointHoverBackgroundColor: '#06b6d4',
                                pointHoverBorderColor: '#fff',
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                display: false,
                            },
                            tooltip: {
                                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                                titleColor: '#f1f5f9',
                                bodyColor: '#94a3b8',
                                borderColor: 'rgba(255, 255, 255, 0.06)',
                                borderWidth: 1,
                                cornerRadius: 10,
                                padding: 14,
                                titleFont: { family: 'Inter', size: 13, weight: '600' },
                                bodyFont: { family: 'Inter', size: 12 },
                                displayColors: true,
                                boxWidth: 10,
                                boxHeight: 10,
                                boxPadding: 4,
                            },
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.04)',
                                    drawBorder: false,
                                },
                                ticks: {
                                    color: '#64748b',
                                    font: { family: 'Inter', size: 11 },
                                    maxRotation: 0,
                                },
                                title: {
                                    display: true,
                                    text: 'Time',
                                    color: '#64748b',
                                    font: { family: 'Inter', size: 12, weight: '500' },
                                },
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.04)',
                                    drawBorder: false,
                                },
                                ticks: {
                                    color: '#64748b',
                                    font: { family: 'Inter', size: 11 },
                                },
                                title: {
                                    display: true,
                                    text: 'Values',
                                    color: '#64748b',
                                    font: { family: 'Inter', size: 12, weight: '500' },
                                },
                            },
                        },
                    },
                });
            })
            .catch(error => {
                console.error('Error fetching ThingSpeak data:', error);
            });
    }
});